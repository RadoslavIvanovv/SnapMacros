import { FoodDatabase, Food } from "./FoodDatabase";
import type { Remaining } from "./types";

export type Suggestion = Food & { _density: string };

// Ranks foods (from the user's preferred list, or the whole DB) by how well they
// fill the remaining calorie/protein budget, rewarding protein density.
export class SuggestionEngine {
  private static _instance?: SuggestionEngine;
  static get instance(): SuggestionEngine {
    if (!SuggestionEngine._instance) SuggestionEngine._instance = new SuggestionEngine();
    return SuggestionEngine._instance;
  }

  suggest(remaining: Remaining, preferredIds: string[]): Suggestion[] {
    const db = FoodDatabase.instance;
    const pool: Food[] =
      preferredIds && preferredIds.length
        ? (preferredIds.map((id) => db.getById(id)).filter(Boolean) as Food[])
        : db.all();

    const calLeft = Math.max(remaining.calories, 0);
    const protLeft = Math.max(remaining.protein, 0);

    const scored = pool.map((food) => {
      const protCover = protLeft > 0 ? Math.min(food.protein / protLeft, 1.2) : 0;

      let calFit: number;
      if (calLeft <= 0) {
        calFit = -food.cal / 200;
      } else if (food.cal <= calLeft) {
        calFit = 1 - Math.abs(calLeft - food.cal) / (calLeft + 200);
      } else {
        calFit = -(food.cal - calLeft) / (calLeft + 200);
      }

      const density = food.cal > 0 ? (food.protein / food.cal) * 100 : 0;
      const score = protCover * 2.0 + calFit * 1.0 + density * 0.05;
      return { food, score, density };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((s) => ({ ...s.food, _density: s.density.toFixed(1) })) as Suggestion[];
  }
}
