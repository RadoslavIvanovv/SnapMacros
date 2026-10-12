import type { FoodData } from "./types";

// A single food item. Values are per one `serving`.
export class Food implements FoodData {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly serving: string,
    public readonly cal: number,
    public readonly protein: number,
    public readonly carbs: number,
    public readonly fat: number,
    public readonly fiber: number,
    public readonly sugar: number,
    public readonly tags: string[]
  ) {}
}

// The built-in food database. Singleton — access via FoodDatabase.instance.
export class FoodDatabase {
  private static _instance?: FoodDatabase;
  static get instance(): FoodDatabase {
    if (!FoodDatabase._instance) FoodDatabase._instance = new FoodDatabase();
    return FoodDatabase._instance;
  }

  private readonly foods: Food[];
  private constructor() {
    this.foods = FoodDatabase.seed();
  }

  all(): Food[] {
    return this.foods;
  }

  search(query: string): Food[] {
    const q = (query || "").trim().toLowerCase();
    if (!q) return this.foods;
    return this.foods.filter((f) => f.name.toLowerCase().includes(q));
  }

  getById(id: string): Food | undefined {
    return this.foods.find((f) => f.id === id);
  }

  private static seed(): Food[] {
    return [
      // Proteins
      new Food("chicken_breast", "Chicken breast (grilled)", "150 g", 248, 46, 0, 6, 0, 0, ["protein", "meat", "lunch", "dinner"]),
      new Food("chicken_thigh", "Chicken thigh (roasted)", "150 g", 318, 39, 0, 17, 0, 0, ["protein", "meat", "dinner"]),
      new Food("salmon", "Salmon fillet (baked)", "150 g", 312, 34, 0, 19, 0, 0, ["protein", "fish", "dinner"]),
      new Food("tuna_can", "Tuna, canned in water", "1 can (100 g)", 116, 26, 0, 1, 0, 0, ["protein", "fish", "lunch"]),
      new Food("cod", "Cod fillet (baked)", "150 g", 140, 31, 0, 1, 0, 0, ["protein", "fish", "dinner"]),
      new Food("lean_beef", "Lean beef steak", "150 g", 271, 39, 0, 12, 0, 0, ["protein", "meat", "dinner"]),
      new Food("ground_beef", "Ground beef 90/10", "150 g", 264, 33, 0, 14, 0, 0, ["protein", "meat", "dinner"]),
      new Food("pork_loin", "Pork loin (grilled)", "150 g", 286, 39, 0, 13, 0, 0, ["protein", "meat", "dinner"]),
      new Food("turkey_breast", "Turkey breast (roasted)", "150 g", 189, 44, 0, 2, 0, 0, ["protein", "meat", "lunch", "dinner"]),
      new Food("shrimp", "Shrimp (cooked)", "150 g", 149, 36, 2, 1, 0, 0, ["protein", "fish", "dinner"]),
      new Food("eggs", "Eggs (whole)", "2 large", 156, 13, 1, 11, 0, 1, ["protein", "breakfast"]),
      new Food("egg_whites", "Egg whites", "4 large", 68, 14, 1, 0, 0, 1, ["protein", "breakfast"]),
      new Food("tofu", "Firm tofu", "150 g", 217, 24, 5, 13, 3, 1, ["protein", "vegetarian", "vegan", "dinner"]),
      new Food("tempeh", "Tempeh", "100 g", 192, 20, 8, 11, 6, 0, ["protein", "vegetarian", "vegan", "dinner"]),
      new Food("greek_yogurt", "Greek yogurt (0% fat)", "170 g", 100, 17, 6, 0, 0, 6, ["protein", "dairy", "breakfast", "snack"]),
      new Food("cottage_cheese", "Cottage cheese (low-fat)", "150 g", 120, 20, 5, 3, 0, 5, ["protein", "dairy", "snack"]),
      new Food("whey_shake", "Whey protein shake", "1 scoop + water", 120, 25, 3, 2, 0, 2, ["protein", "supplement", "snack"]),
      new Food("lentils", "Lentils (cooked)", "1 cup (198 g)", 230, 18, 40, 1, 16, 4, ["protein", "vegan", "vegetarian", "carb", "lunch"]),
      new Food("chickpeas", "Chickpeas (cooked)", "1 cup (164 g)", 269, 15, 45, 4, 12, 8, ["protein", "vegan", "vegetarian", "carb", "lunch"]),
      new Food("black_beans", "Black beans (cooked)", "1 cup (172 g)", 227, 15, 41, 1, 15, 0, ["protein", "vegan", "vegetarian", "carb", "lunch"]),
      new Food("edamame", "Edamame (shelled)", "1 cup (155 g)", 188, 18, 14, 8, 8, 3, ["protein", "vegan", "vegetarian", "snack"]),
      // Carbs / grains
      new Food("white_rice", "White rice (cooked)", "1 cup (158 g)", 205, 4, 45, 0, 1, 0, ["carb", "lunch", "dinner"]),
      new Food("brown_rice", "Brown rice (cooked)", "1 cup (195 g)", 216, 5, 45, 2, 4, 1, ["carb", "lunch", "dinner"]),
      new Food("quinoa", "Quinoa (cooked)", "1 cup (185 g)", 222, 8, 39, 4, 5, 2, ["carb", "vegetarian", "lunch", "dinner"]),
      new Food("sweet_potato", "Sweet potato (baked)", "1 medium (150 g)", 129, 3, 30, 0, 5, 9, ["carb", "dinner"]),
      new Food("potato", "Potato (boiled)", "1 medium (170 g)", 146, 4, 33, 0, 3, 1, ["carb", "dinner"]),
      new Food("pasta", "Pasta (cooked)", "1 cup (140 g)", 220, 8, 43, 1, 3, 1, ["carb", "dinner"]),
      new Food("oats", "Oats (dry)", "1/2 cup (40 g)", 150, 5, 27, 3, 4, 1, ["carb", "breakfast"]),
      new Food("bread", "Whole-grain bread", "2 slices", 160, 8, 30, 2, 4, 4, ["carb", "breakfast", "lunch"]),
      new Food("bagel", "Bagel (plain)", "1 medium", 245, 10, 48, 2, 2, 6, ["carb", "breakfast"]),
      new Food("tortilla", "Flour tortilla", "1 large", 190, 5, 33, 5, 2, 1, ["carb", "lunch"]),
      // Vegetables
      new Food("broccoli", "Broccoli (steamed)", "1 cup (156 g)", 55, 4, 11, 0, 5, 2, ["veg", "lunch", "dinner"]),
      new Food("spinach", "Spinach (raw)", "2 cups (60 g)", 14, 2, 2, 0, 1, 0, ["veg", "lunch", "dinner"]),
      new Food("mixed_salad", "Mixed green salad", "1 bowl", 45, 2, 8, 0, 3, 3, ["veg", "lunch", "dinner"]),
      new Food("avocado", "Avocado", "1/2 fruit", 160, 2, 9, 15, 7, 1, ["fat", "breakfast", "lunch"]),
      // Fruit
      new Food("banana", "Banana", "1 medium", 105, 1, 27, 0, 3, 14, ["fruit", "snack", "breakfast"]),
      new Food("apple", "Apple", "1 medium", 95, 1, 25, 0, 4, 19, ["fruit", "snack"]),
      new Food("berries", "Mixed berries", "1 cup (150 g)", 85, 1, 21, 0, 6, 12, ["fruit", "snack", "breakfast"]),
      // Fats / nuts
      new Food("almonds", "Almonds", "1 oz (28 g)", 164, 6, 6, 14, 3, 1, ["fat", "snack"]),
      new Food("peanut_butter", "Peanut butter", "2 tbsp", 188, 8, 6, 16, 2, 3, ["fat", "snack", "breakfast"]),
      new Food("olive_oil", "Olive oil", "1 tbsp", 119, 0, 0, 14, 0, 0, ["fat"]),
      new Food("cheese", "Cheddar cheese", "1 oz (28 g)", 113, 7, 1, 9, 0, 0, ["dairy", "fat", "snack"]),
      // Common meals
      new Food("chicken_rice_bowl", "Chicken & rice bowl", "1 bowl", 520, 45, 60, 10, 4, 3, ["meal", "lunch", "dinner"]),
      new Food("protein_oatmeal", "Oatmeal + whey + banana", "1 bowl", 375, 31, 52, 6, 6, 16, ["meal", "breakfast"]),
      new Food("burrito", "Chicken burrito", "1 burrito", 620, 38, 68, 22, 8, 4, ["meal", "lunch"]),
      new Food("salmon_veg", "Salmon + sweet potato + broccoli", "1 plate", 496, 41, 36, 22, 8, 11, ["meal", "dinner"]),
      new Food("greek_bowl", "Greek yogurt + berries + almonds", "1 bowl", 349, 24, 30, 14, 6, 19, ["meal", "breakfast", "snack"]),
    ];
  }
}
