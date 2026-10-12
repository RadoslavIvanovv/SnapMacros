import { colors } from "../theme";
import { MacroKey } from "./types";
import type { LogEntryData, Goals } from "./types";

export interface MacroDescriptor {
  key: MacroKey;
  label: string;
  color: string;
  isLimit?: boolean;
}

// Catalog of the gram-based macros tracked alongside calories.
// All descriptors and keys live here as static members — no floating constants.
export class MacroCatalog {
  static readonly gramMacros: readonly MacroDescriptor[] = [
    { key: MacroKey.Protein, label: "Protein", color: colors.protein },
    { key: MacroKey.Carbs, label: "Carbs", color: colors.carbs },
    { key: MacroKey.Fat, label: "Fat", color: colors.fat },
    { key: MacroKey.Fiber, label: "Fiber", color: colors.fiber },
    { key: MacroKey.Sugar, label: "Sugar", color: colors.sugar, isLimit: true },
  ];

  static readonly keys: readonly MacroKey[] = MacroCatalog.gramMacros.map((m) => m.key);
}

// Pure calculations over nutrition data.
export class NutritionMath {
  // Scale a food/entry (cal + all macros) by a serving quantity.
  static scale(src: Partial<LogEntryData>, qty = 1): { cal: number } & Record<MacroKey, number> {
    const out: any = { cal: Math.round((src.cal || 0) * qty) };
    for (const k of MacroCatalog.keys) out[k] = Math.round(((src as any)[k] || 0) * qty);
    return out;
  }

  // Sum a day's log entries into daily totals.
  static sumEntries(entries: LogEntryData[]): Goals {
    const t: Goals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    for (const e of entries) {
      t.calories += e.cal || 0;
      for (const k of MacroCatalog.keys) (t as any)[k] += (e as any)[k] || 0;
    }
    return t;
  }
}
