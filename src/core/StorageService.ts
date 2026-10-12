import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoalType, ActivityLevel, Sex } from "./types";
import type { Goals, ProfileData, LogEntryData } from "./types";

type LogMap = Record<string, LogEntryData[]>;

// Persistence layer over AsyncStorage. Singleton — access via StorageService.instance.
export class StorageService {
  private static _instance?: StorageService;
  static get instance(): StorageService {
    if (!StorageService._instance) StorageService._instance = new StorageService();
    return StorageService._instance;
  }

  private static readonly KEYS = {
    goals: "sm_goals",
    logs: "sm_logs",
    preferred: "sm_preferred",
    apiKey: "sm_apikey",
    profile: "sm_profile",
  } as const;

  private static readonly DEFAULT_GOALS: Goals = {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 66,
    fiber: 31,
    sugar: 55,
  };

  private static readonly DEFAULT_PROFILE: ProfileData = {
    weight: "",
    weightUnit: "kg",
    height: "",
    age: "",
    sex: Sex.Male,
    activity: ActivityLevel.Light,
    goal: GoalType.Maintain,
  };

  // ---- Goals ----
  async getGoals(): Promise<Goals> {
    try {
      const raw = await AsyncStorage.getItem(StorageService.KEYS.goals);
      return raw ? { ...StorageService.DEFAULT_GOALS, ...JSON.parse(raw) } : StorageService.DEFAULT_GOALS;
    } catch {
      return StorageService.DEFAULT_GOALS;
    }
  }

  async setGoals(goals: Goals): Promise<void> {
    await AsyncStorage.setItem(StorageService.KEYS.goals, JSON.stringify(goals));
  }

  // ---- Profile ----
  async getProfile(): Promise<ProfileData> {
    try {
      const raw = await AsyncStorage.getItem(StorageService.KEYS.profile);
      return raw ? { ...StorageService.DEFAULT_PROFILE, ...JSON.parse(raw) } : StorageService.DEFAULT_PROFILE;
    } catch {
      return StorageService.DEFAULT_PROFILE;
    }
  }

  async setProfile(profile: ProfileData): Promise<void> {
    await AsyncStorage.setItem(StorageService.KEYS.profile, JSON.stringify(profile));
  }

  // ---- API key ----
  async getApiKey(): Promise<string> {
    try {
      return (await AsyncStorage.getItem(StorageService.KEYS.apiKey)) || "";
    } catch {
      return "";
    }
  }

  async setApiKey(key: string): Promise<void> {
    await AsyncStorage.setItem(StorageService.KEYS.apiKey, key || "");
  }

  // ---- Logs ----
  todayKey(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async getLogsForDay(dayKey: string): Promise<LogEntryData[]> {
    try {
      const raw = await AsyncStorage.getItem(StorageService.KEYS.logs);
      const all: LogMap = raw ? JSON.parse(raw) : {};
      return all[dayKey] || [];
    } catch {
      return [];
    }
  }

  async addLogEntry(dayKey: string, entry: LogEntryData): Promise<LogEntryData> {
    const raw = await AsyncStorage.getItem(StorageService.KEYS.logs);
    const all: LogMap = raw ? JSON.parse(raw) : {};
    const withId: LogEntryData = { id: Date.now().toString(), ...entry };
    all[dayKey] = [withId, ...(all[dayKey] || [])];
    await AsyncStorage.setItem(StorageService.KEYS.logs, JSON.stringify(all));
    return withId;
  }

  async removeLogEntry(dayKey: string, entryId: string): Promise<void> {
    const raw = await AsyncStorage.getItem(StorageService.KEYS.logs);
    const all: LogMap = raw ? JSON.parse(raw) : {};
    all[dayKey] = (all[dayKey] || []).filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(StorageService.KEYS.logs, JSON.stringify(all));
  }

  // ---- Preferred foods ----
  async getPreferred(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(StorageService.KEYS.preferred);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async togglePreferred(foodId: string): Promise<string[]> {
    const current = await this.getPreferred();
    const next = current.includes(foodId)
      ? current.filter((id) => id !== foodId)
      : [...current, foodId];
    await AsyncStorage.setItem(StorageService.KEYS.preferred, JSON.stringify(next));
    return next;
  }
}
