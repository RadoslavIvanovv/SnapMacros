import { GoalType, ActivityLevel, Sex } from "./types";
import type { ProfileData, ComputedGoals } from "./types";

export interface GoalOption {
  id: GoalType;
  label: string;
  proteinPerKg: number;
  calAdj: number;
}
export interface ActivityOption {
  id: ActivityLevel;
  label: string;
  factor: number;
}
export interface SexOption {
  id: Sex;
  label: string;
}

// Calorie & protein/macro target calculator.
//
// Calories: Mifflin-St Jeor BMR x activity factor = maintenance (TDEE), adjusted
//   per goal. Falls back to a weight-only BMR estimate if height/age are missing.
// Protein: grams per kg of bodyweight, set by goal.
// Carbs/Fat/Fiber/Sugar: derived from the calorie budget.
//
// References: Mifflin MD et al. 1990 (BMR); Morton RW et al. 2018 and
// Helms ER et al. 2014 (protein needs for muscle / dieting).
export class GoalCalculator {
  static readonly goals: readonly GoalOption[] = [
    { id: GoalType.Lose, label: "Lose weight", proteinPerKg: 2.0, calAdj: -0.2 },
    { id: GoalType.Maintain, label: "Maintain", proteinPerKg: 1.6, calAdj: 0.0 },
    { id: GoalType.Muscle, label: "Gain muscle", proteinPerKg: 1.9, calAdj: 0.12 },
    { id: GoalType.Strength, label: "Build strength", proteinPerKg: 1.8, calAdj: 0.08 },
  ];

  static readonly activities: readonly ActivityOption[] = [
    { id: ActivityLevel.Sedentary, label: "Sedentary (little/no exercise)", factor: 1.2 },
    { id: ActivityLevel.Light, label: "Light (1-3 days/week)", factor: 1.375 },
    { id: ActivityLevel.Moderate, label: "Moderate (3-5 days/week)", factor: 1.55 },
    { id: ActivityLevel.Active, label: "Active (6-7 days/week)", factor: 1.725 },
    { id: ActivityLevel.Athlete, label: "Athlete (2x/day, physical job)", factor: 1.9 },
  ];

  static readonly sexes: readonly SexOption[] = [
    { id: Sex.Male, label: "Male" },
    { id: Sex.Female, label: "Female" },
  ];

  private static readonly LB_TO_KG = 0.453592;
  private static readonly CAL_FLOOR = 1200; // don't recommend an unsafe deficit

  static toKg(weight: number | string, unit: string): number {
    const w = Number(weight) || 0;
    return unit === "lb" ? w * GoalCalculator.LB_TO_KG : w;
  }

  // Returns computed goals or null if there isn't a plausible weight.
  static compute(profile: ProfileData): ComputedGoals | null {
    const kg = GoalCalculator.toKg(profile.weight, profile.weightUnit);
    if (!kg || kg < 20) return null;

    const goal = GoalCalculator.goals.find((g) => g.id === profile.goal) || GoalCalculator.goals[1];
    const activity =
      GoalCalculator.activities.find((a) => a.id === profile.activity) || GoalCalculator.activities[1];
    const sexBonus = profile.sex === Sex.Female ? -161 : 5;

    const cm = Number(profile.height) || 0;
    const age = Number(profile.age) || 0;

    let bmr: number;
    let usedFallback = false;
    if (cm > 0 && age > 0) {
      bmr = 10 * kg + 6.25 * cm - 5 * age + sexBonus; // Mifflin-St Jeor
    } else {
      bmr = kg * (profile.sex === Sex.Female ? 21 : 22); // weight-only fallback
      usedFallback = true;
    }

    const tdee = bmr * activity.factor;
    let calories = Math.round((tdee * (1 + goal.calAdj)) / 10) * 10;
    if (calories < GoalCalculator.CAL_FLOOR) calories = GoalCalculator.CAL_FLOOR;

    const protein = Math.round(kg * goal.proteinPerKg);
    const fat = Math.round((calories * 0.27) / 9);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    const fiber = Math.round((14 * calories) / 1000);
    const sugar = Math.round((calories * 0.1) / 4);

    return { calories, protein, carbs, fat, fiber, sugar, tdee: Math.round(tdee), usedFallback };
  }
}
