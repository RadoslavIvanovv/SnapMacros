import type { AiFoodEstimate, AiMeal, Remaining } from "./types";

// Called before each retry so the UI can show progress instead of looking frozen.
export interface RetryInfo {
  attempt: number; // the attempt about to run (2..MAX_ATTEMPTS)
  max: number;
  waitMs: number; // how long we're waiting before this attempt
}
export type RetryListener = (info: RetryInfo) => void;

// Wraps Google Gemini (free tier) for photo analysis and meal composition.
// Construct with an API key: new GeminiService(apiKey).
export class GeminiService {
  // Flash-Lite: the fastest free-tier model with the highest rate limit
  // (~30 req/min vs ~10 for regular Flash) — fewer timeouts and 429s.
  // The "-latest" alias tracks the current version so it survives Google's
  // model rotations.
  private static readonly MODEL = "gemini-flash-lite-latest";
  private static readonly ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GeminiService.MODEL}:generateContent`;

  // Transient server statuses worth retrying, and the backoff schedule.
  private static readonly RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
  // Fewer attempts so retries don't burn through the free-tier rate limit.
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly BASE_BACKOFF_MS = 800;
  private static readonly MAX_BACKOFF_MS = 8000;
  private static readonly JITTER_MS = 400;
  // Give a real (but slow) response room to finish before aborting, and cap the
  // total time spent retrying so the UI never spins forever.
  private static readonly REQUEST_TIMEOUT_MS = 20000;
  private static readonly OVERALL_DEADLINE_MS = 35000;

  private static readonly PHOTO_PROMPT = `You are a nutrition estimator. Look at this photo of a meal.
Identify the food(s) and estimate the TOTAL nutrition for the portion shown.
Respond with ONLY a JSON object, no markdown, no explanation, in exactly this shape
(all macro values are integer grams):
{"name": "short food description", "calories": <int kcal>, "protein": <int>, "carbs": <int>, "fat": <int>, "fiber": <int>, "sugar": <int>}
If you cannot identify any food, use {"name": "Unknown", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}.`;

  constructor(private readonly apiKey: string) {}

  async analyzeMealPhoto(base64: string, onRetry?: RetryListener): Promise<AiFoodEstimate> {
    if (!base64) throw new Error("No photo data to analyze.");
    const text = await this.call(
      [
        { text: GeminiService.PHOTO_PROMPT },
        { inline_data: { mime_type: "image/jpeg", data: base64 } },
      ],
      0.2,
      onRetry
    );
    const p = GeminiService.extractJson(text);
    return {
      name: String(p.name || "Meal").slice(0, 60),
      calories: GeminiService.num(p.calories),
      protein: GeminiService.num(p.protein),
      carbs: GeminiService.num(p.carbs),
      fat: GeminiService.num(p.fat),
      fiber: GeminiService.num(p.fiber),
      sugar: GeminiService.num(p.sugar),
    };
  }

  async suggestMeals(
    opts: {
      foods: string[];
      remaining: Remaining;
      goalLabel: string;
    },
    onRetry?: RetryListener
  ): Promise<AiMeal[]> {
    const list = (opts.foods && opts.foods.length ? opts.foods : ["any common foods"]).join(", ");
    const remCal = Math.max(Math.round(opts.remaining.calories), 0);
    const remProt = Math.max(Math.round(opts.remaining.protein), 0);

    const prompt = `You are a meal-planning assistant. Build 3 realistic meal ideas
using MAINLY these preferred foods: ${list}.
The meals together should help the person${opts.goalLabel ? ` whose goal is "${opts.goalLabel}"` : ""}
fit roughly ${remCal} kcal and ${remProt} g protein remaining for today (each meal is
a portion of that, not the whole amount). You may add small common extras (oil, spices,
a vegetable) but stay centered on the preferred foods.
Respond with ONLY JSON in exactly this shape, no markdown (macro values are integer grams):
{"meals":[{"name":"short meal name","ingredients":"comma-separated items with rough amounts","calories":<int kcal>,"protein":<int>,"carbs":<int>,"fat":<int>,"fiber":<int>,"sugar":<int>}]}`;

    const text = await this.call([{ text: prompt }], 0.6, onRetry);
    const parsed = GeminiService.extractJson(text);
    const meals = Array.isArray(parsed) ? parsed : parsed.meals;
    if (!Array.isArray(meals)) throw new Error("AI returned no meals. Try again.");

    return meals.slice(0, 3).map((m: any, i: number) => ({
      id: `aimeal_${i}`,
      name: String(m.name || "Meal").slice(0, 80),
      ingredients: String(m.ingredients || ""),
      calories: GeminiService.num(m.calories),
      protein: GeminiService.num(m.protein),
      carbs: GeminiService.num(m.carbs),
      fat: GeminiService.num(m.fat),
      fiber: GeminiService.num(m.fiber),
      sugar: GeminiService.num(m.sugar),
    }));
  }

  // ---- internals ----
  private async call(parts: any[], temperature = 0.2, onRetry?: RetryListener): Promise<string> {
    if (!this.apiKey) {
      throw new Error("No AI key set yet. Add a free Gemini key in Settings to use AI features.");
    }

    const body = {
      contents: [{ parts }],
      generationConfig: { temperature, responseMimeType: "application/json" },
    };

    const url = `${GeminiService.ENDPOINT}?key=${encodeURIComponent(this.apiKey)}`;
    const started = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= GeminiService.MAX_ATTEMPTS; attempt++) {
      // Exponential backoff with jitter before each retry — unless we've already
      // spent our overall time budget, in which case give up now.
      if (attempt > 1) {
        if (Date.now() - started > GeminiService.OVERALL_DEADLINE_MS) break;
        const backoff = Math.min(
          GeminiService.BASE_BACKOFF_MS * Math.pow(2, attempt - 2),
          GeminiService.MAX_BACKOFF_MS
        );
        const waitMs = backoff + Math.floor(Math.random() * GeminiService.JITTER_MS);
        if (onRetry) onRetry({ attempt, max: GeminiService.MAX_ATTEMPTS, waitMs });
        await GeminiService.delay(waitMs);
      }

      let res: Response;
      try {
        res = await GeminiService.fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err: any) {
        // A stalled request (aborted by timeout) or a dropped connection — retry.
        const kind = err?.name === "AbortError" ? "timed out (no response in time)" : `network error: ${err?.message || "unknown"}`;
        console.warn(`[SnapMacros AI] attempt ${attempt} ${kind}`);
        lastError =
          err?.name === "AbortError"
            ? new Error("Gemini is taking too long to respond. Please try again in a moment.")
            : new Error("Couldn't reach the AI. Check your internet connection and try again.");
        continue;
      }

      if (res.ok) {
        const json = await res.json();
        return json?.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      console.warn(`[SnapMacros AI] attempt ${attempt} HTTP ${res.status}`);
      const error = GeminiService.describeStatus(res.status);
      if (GeminiService.RETRYABLE_STATUSES.has(res.status)) {
        lastError = error; // transient — retry until attempts / deadline run out
        continue;
      }
      throw error; // permanent (bad key, model, quota) — fail fast
    }

    throw lastError ?? new Error("The AI request failed. Please try again in a moment.");
  }

  // fetch that aborts if the server doesn't respond within REQUEST_TIMEOUT_MS.
  private static async fetchWithTimeout(url: string, options: any): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GeminiService.REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  // Maps an HTTP status to a clear, user-facing message.
  private static describeStatus(status: number): Error {
    switch (status) {
      case 400:
      case 403:
        return new Error("Your Gemini API key was rejected. Open Settings and check it's pasted correctly.");
      case 404:
        return new Error("The AI model is unavailable — the app may need a model-name update.");
      case 429:
        return new Error("Gemini's free rate limit was hit. Wait about a minute and try again — the free tier allows a limited number of requests per minute and per day.");
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error("Gemini is temporarily busy on Google's side. Please try again in a few seconds.");
      default:
        return new Error(`The AI request failed (error ${status}). Please try again.`);
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static num(v: any): number {
    return Math.max(0, Math.round(Number(v) || 0));
  }

  private static extractJson(text: string): any {
    if (!text) throw new Error("Empty response from AI.");
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) throw new Error("AI did not return readable data.");

    let candidate = match[0]
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    try {
      return JSON.parse(candidate);
    } catch {
      const name = candidate.match(/"name"\s*:\s*"([^"]*)"/);
      const cal = candidate.match(/"calories"\s*:\s*(\d+)/);
      const prot = candidate.match(/"protein"\s*:\s*(\d+)/);
      if (cal || prot) {
        return {
          name: name ? name[1] : "Meal",
          calories: cal ? Number(cal[1]) : 0,
          protein: prot ? Number(prot[1]) : 0,
        };
      }
      throw new Error("AI returned malformed data. Try again or log manually.");
    }
  }
}
