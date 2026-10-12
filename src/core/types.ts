// Shared domain enums and data-shape interfaces for the SnapMacros backend.
// These are type declarations only — the runtime logic lives in the classes.

export enum MacroKey {
  Protein = "protein",
  Carbs = "carbs",
  Fat = "fat",
  Fiber = "fiber",
  Sugar = "sugar",
}

export enum GoalType {
  Lose = "lose",
  Maintain = "maintain",
  Muscle = "muscle",
  Strength = "strength",
}

export enum ActivityLevel {
  Sedentary = "sedentary",
  Light = "light",
  Moderate = "moderate",
  Active = "active",
  Athlete = "athlete",
}

export enum Sex {
  Male = "male",
  Female = "female",
}

// Daily totals / goals use `calories`; food items and log entries use `cal`.
export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface FoodData {
  id: string;
  name: string;
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  tags: string[];
}

export interface LogEntryData {
  id?: string;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  qty?: number;
  photo?: string | null;
  foodId?: string;
}

export interface ProfileData {
  weight: string | number;
  weightUnit: "kg" | "lb";
  height: string | number;
  age: string | number;
  sex: Sex;
  activity: ActivityLevel;
  goal: GoalType;
}

export interface ComputedGoals extends Goals {
  tdee: number;
  usedFallback: boolean;
}

export interface AiFoodEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface AiMeal extends AiFoodEstimate {
  id: string;
  ingredients: string;
}

export interface Remaining {
  calories: number;
  protein: number;
}
