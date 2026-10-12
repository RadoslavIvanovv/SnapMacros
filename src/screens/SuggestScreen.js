import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors } from "../theme";
import { NutritionMath } from "../core/Nutrition";
import { SuggestionEngine } from "../core/SuggestionEngine";
import { FoodDatabase } from "../core/FoodDatabase";
import { GoalCalculator } from "../core/GoalCalculator";
import { GeminiService } from "../core/GeminiService";

export default function SuggestScreen({ goals, entries, preferredIds, apiKey, profile, onQuickLog }) {
  const totals = NutritionMath.sumEntries(entries);
  const remaining = {
    calories: goals.calories - totals.calories,
    protein: goals.protein - totals.protein,
  };

  const [aiMeals, setAiMeals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState("");

  const suggestions = useMemo(
    () => SuggestionEngine.instance.suggest(remaining, preferredIds),
    [remaining.calories, remaining.protein, preferredIds]
  );

  const preferredNames = useMemo(
    () => (preferredIds || []).map((id) => FoodDatabase.instance.getById(id)?.name).filter(Boolean),
    [preferredIds]
  );

  async function generate() {
    if (!apiKey) {
      Alert.alert(
        "No API key",
        "Add a free Gemini API key in Settings to generate full meal ideas with AI."
      );
      return;
    }
    setLoading(true);
    setLoadStatus("");
    try {
      const goalLabel = (GoalCalculator.goals.find((g) => g.id === profile?.goal) || {}).label || "";
      const meals = await new GeminiService(apiKey).suggestMeals(
        { foods: preferredNames, remaining, goalLabel },
        () => setLoadStatus("Gemini is busy — retrying…")
      );
      setAiMeals(meals);
    } catch (e) {
      Alert.alert("Couldn't generate meals", e.message || "Something went wrong.", [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: generate },
      ]);
    } finally {
      setLoading(false);
      setLoadStatus("");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.h1}>Suggestions</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Remaining today:{"  "}
          <Text style={{ color: colors.calories, fontWeight: "700" }}>
            {Math.max(Math.round(remaining.calories), 0)} kcal
          </Text>
          {"  ·  "}
          <Text style={{ color: colors.protein, fontWeight: "700" }}>
            {Math.max(Math.round(remaining.protein), 0)} g protein
          </Text>
        </Text>
      </View>

      {/* ---- AI full-meal ideas ---- */}
      <TouchableOpacity
        style={[styles.aiBtn, loading && styles.aiBtnDisabled]}
        onPress={generate}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#04283a" />
            <Text style={styles.aiBtnText}>  {loadStatus || "Building meals…"}</Text>
          </>
        ) : (
          <Text style={styles.aiBtnText}>✨  Generate meal ideas from my foods</Text>
        )}
      </TouchableOpacity>
      {!preferredNames.length && (
        <Text style={styles.hint}>
          Tip: favorite some foods in Settings so the AI builds meals around what you like.
        </Text>
      )}

      {aiMeals &&
        aiMeals.map((m) => (
          <View key={m.id} style={styles.aiCard}>
            <Text style={styles.name}>{m.name}</Text>
            {!!m.ingredients && <Text style={styles.ingredients}>{m.ingredients}</Text>}
            <View style={styles.aiCardFooter}>
              <Text style={styles.meta}>
                {m.calories} kcal · P{m.protein} C{m.carbs || 0} F{m.fat || 0}
              </Text>
              <TouchableOpacity
                style={styles.logBtn}
                onPress={() =>
                  onQuickLog({
                    id: m.id,
                    name: m.name,
                    cal: m.calories,
                    protein: m.protein,
                    carbs: m.carbs,
                    fat: m.fat,
                    fiber: m.fiber,
                    sugar: m.sugar,
                  })
                }
              >
                <Text style={styles.logText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      <Text style={styles.sectionLabel}>Quick single-food picks</Text>

      {remaining.protein <= 0 && remaining.calories <= 0 ? (
        <Text style={styles.done}>🎉 You’ve hit both goals for today. Nice work.</Text>
      ) : (
        suggestions.map((f) => (
          <View key={f.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{f.name}</Text>
              <Text style={styles.meta}>
                {f.serving} · {f.cal} kcal · {f.protein} g protein
              </Text>
              <Text style={styles.density}>{f._density} g protein / 100 kcal</Text>
            </View>
            <TouchableOpacity style={styles.logBtn} onPress={() => onQuickLog(f)}>
              <Text style={styles.logText}>Log</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 30, fontWeight: "800", marginBottom: 16 },
  summary: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  summaryText: { color: colors.text, fontSize: 15 },
  hint: { color: colors.subtext, fontStyle: "italic", marginBottom: 16 },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.protein,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 12,
  },
  aiBtnDisabled: { opacity: 0.7 },
  aiBtnText: { color: "#04283a", fontWeight: "800", fontSize: 15 },
  aiCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.protein,
  },
  ingredients: { color: colors.subtext, fontSize: 13, marginTop: 4, lineHeight: 18 },
  aiCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  done: { color: colors.protein, fontSize: 18, fontWeight: "700", marginTop: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.subtext, fontSize: 13, marginTop: 2 },
  density: { color: colors.protein, fontSize: 12, marginTop: 4 },
  logBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  logText: { color: "#04283a", fontWeight: "800" },
});
