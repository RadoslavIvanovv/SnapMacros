import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme";
import { FoodDatabase } from "../core/FoodDatabase";
import { GoalCalculator } from "../core/GoalCalculator";

const GOAL_FIELDS = [
  { key: "calories", label: "Calories (kcal)" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
  { key: "fiber", label: "Fiber (g)" },
  { key: "sugar", label: "Sugar (g)" },
];

// Small selectable chip.
function Chip({ label, active, onPress, wide }) {
  return (
    <TouchableOpacity
      style={[styles.opt, wide && styles.optWide, active && styles.optOn]}
      onPress={onPress}
    >
      <Text style={[styles.optText, active && styles.optTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({
  goals,
  onSaveGoals,
  preferredIds,
  onTogglePreferred,
  apiKey,
  onSaveApiKey,
  profile,
  onSaveProfile,
}) {
  const asStr = (o) =>
    GOAL_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: String(o[f.key] ?? "") }), {});

  const [g, setG] = useState(asStr(goals));
  const [key, setKey] = useState(apiKey || "");
  const [p, setP] = useState(profile);
  const [calcMsg, setCalcMsg] = useState("");

  function save(next = g) {
    const out = {};
    for (const f of GOAL_FIELDS) {
      const n = parseInt(next[f.key], 10);
      out[f.key] = isNaN(n) ? goals[f.key] : n;
    }
    onSaveGoals(out);
  }

  function updP(patch) {
    const next = { ...p, ...patch };
    setP(next);
    onSaveProfile(next);
  }

  function calculate() {
    const result = GoalCalculator.compute(p);
    if (!result) {
      setCalcMsg("Enter a valid weight first.");
      return;
    }
    const next = asStr(result);
    setG(next);
    save(next);
    const goalLabel = (GoalCalculator.goals.find((g2) => g2.id === p.goal) || {}).label || "";
    setCalcMsg(
      `Set for “${goalLabel}”: ${result.calories} kcal · ${result.protein}p · ` +
        `${result.carbs}c · ${result.fat}f · ${result.fiber} fiber · ${result.sugar} sugar (g).` +
        (result.usedFallback ? " Add height & age for a more accurate calorie number." : "")
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Text style={styles.h1}>Settings</Text>

      {/* ---- Body & goal calculator ---- */}
      <Text style={styles.h2}>Your body & goal</Text>
      <Text style={styles.sub}>
        Enter your details and let the app set science-based calorie & protein targets.
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            keyboardType="decimal-pad"
            placeholder="e.g. 80"
            placeholderTextColor={colors.subtext}
            value={String(p.weight)}
            onChangeText={(v) => updP({ weight: v })}
          />
          <Chip label="kg" active={p.weightUnit === "kg"} onPress={() => updP({ weightUnit: "kg" })} />
          <Chip label="lb" active={p.weightUnit === "lb"} onPress={() => updP({ weightUnit: "lb" })} />
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="optional"
              placeholderTextColor={colors.subtext}
              value={String(p.height)}
              onChangeText={(v) => updP({ height: v })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="optional"
              placeholderTextColor={colors.subtext}
              value={String(p.age)}
              onChangeText={(v) => updP({ age: v })}
            />
          </View>
        </View>

        <Text style={styles.label}>Sex</Text>
        <View style={styles.optRow}>
          {GoalCalculator.sexes.map((s) => (
            <Chip key={s.id} label={s.label} active={p.sex === s.id} onPress={() => updP({ sex: s.id })} />
          ))}
        </View>

        <Text style={styles.label}>Activity</Text>
        <View style={styles.optCol}>
          {GoalCalculator.activities.map((a) => (
            <Chip key={a.id} wide label={a.label} active={p.activity === a.id} onPress={() => updP({ activity: a.id })} />
          ))}
        </View>

        <Text style={styles.label}>Goal</Text>
        <View style={styles.optRow}>
          {GoalCalculator.goals.map((g) => (
            <Chip key={g.id} label={g.label} active={p.goal === g.id} onPress={() => updP({ goal: g.id })} />
          ))}
        </View>

        <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
          <Text style={styles.saveText}>Calculate my targets</Text>
        </TouchableOpacity>
        {!!calcMsg && <Text style={styles.calcMsg}>{calcMsg}</Text>}
      </View>

      {/* ---- Daily goals (auto-filled, still editable) ---- */}
      <Text style={styles.h2}>Daily goals</Text>
      <View style={styles.card}>
        {GOAL_FIELDS.map((f) => (
          <View style={styles.field} key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={g[f.key]}
              onChangeText={(v) => setG((prev) => ({ ...prev, [f.key]: v }))}
              onEndEditing={() => save()}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.saveBtn} onPress={() => save()}>
          <Text style={styles.saveText}>Save goals</Text>
        </TouchableOpacity>
      </View>

      {/* ---- AI ---- */}
      <Text style={styles.h2}>AI photo analysis</Text>
      <Text style={styles.sub}>
        Paste a free Google Gemini API key to auto-estimate calories & protein from
        photos. Get one at aistudio.google.com/apikey (no card needed).
      </Text>
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Gemini API key</Text>
          <TextInput
            style={styles.input}
            placeholder="AIza…"
            placeholderTextColor={colors.subtext}
            value={key}
            onChangeText={setKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={() => onSaveApiKey(key.trim())}>
          <Text style={styles.saveText}>{apiKey ? "Update key" : "Save key"}</Text>
        </TouchableOpacity>
        <Text style={styles.keyStatus}>
          {apiKey ? "✓ Key saved — Analyze button is active." : "No key set — logging is manual."}
        </Text>
      </View>

      {/* ---- Preferred foods ---- */}
      <Text style={styles.h2}>Preferred foods</Text>
      <Text style={styles.sub}>
        Tap to favorite. Suggestions will prioritise these ({preferredIds.length} selected).
      </Text>
      <View style={styles.chips}>
        {FoodDatabase.instance.all().map((f) => {
          const on = preferredIds.includes(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onTogglePreferred(f.id)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {on ? "★ " : ""}
                {f.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 30, fontWeight: "800", marginBottom: 16 },
  h2: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 22, marginBottom: 8 },
  sub: { color: colors.subtext, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: 14 },
  label: { color: colors.text, marginBottom: 6, marginTop: 6, fontWeight: "600" },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  optRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optCol: { gap: 8 },
  opt: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optWide: { alignSelf: "stretch" },
  optOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  optText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  optTextOn: { color: "#04283a", fontWeight: "800" },
  calcBtn: {
    backgroundColor: colors.protein,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  calcMsg: { color: colors.protein, fontSize: 13, marginTop: 10, lineHeight: 18 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveText: { color: "#04283a", fontWeight: "800" },
  keyStatus: { color: colors.subtext, fontSize: 12, marginTop: 10, textAlign: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: "#04283a", fontWeight: "700" },
});
