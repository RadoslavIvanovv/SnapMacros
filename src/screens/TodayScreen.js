import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { colors } from "../theme";
import ProgressBar from "../components/ProgressBar";
import { NutritionMath, MacroCatalog } from "../core/Nutrition";

export default function TodayScreen({ goals, entries, onRemove, onAdd }) {
  const totals = NutritionMath.sumEntries(entries);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={styles.h1}>Today</Text>

      <View style={styles.card}>
        <ProgressBar
          label="Calories"
          value={totals.calories}
          goal={goals.calories}
          unit="kcal"
          color={colors.calories}
        />
        {MacroCatalog.gramMacros.map((m) => (
          <ProgressBar
            key={m.key}
            label={m.label}
            value={totals[m.key]}
            goal={goals[m.key]}
            unit="g"
            color={m.color}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>＋  Log a meal (photo)</Text>
      </TouchableOpacity>

      <Text style={styles.h2}>Logged meals</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>
          Nothing logged yet. Tap “Log a meal” to snap your first one.
        </Text>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={styles.entry}>
            {e.photo ? (
              <Image source={{ uri: e.photo }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 22 }}>🍽️</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.entryName}>
                {e.name}
                {e.qty && e.qty !== 1 ? `  ×${e.qty}` : ""}
              </Text>
              <Text style={styles.entryMeta}>
                {Math.round(e.cal)} kcal
              </Text>
              <Text style={styles.entryMacros}>
                P {Math.round(e.protein || 0)} · C {Math.round(e.carbs || 0)} · F{" "}
                {Math.round(e.fat || 0)} · Fib {Math.round(e.fiber || 0)} · Sug{" "}
                {Math.round(e.sugar || 0)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onRemove(e.id)} hitSlop={10}>
              <Text style={styles.remove}>✕</Text>
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
  h2: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },
  addBtnText: { color: "#04283a", fontSize: 16, fontWeight: "800" },
  empty: { color: colors.subtext, fontStyle: "italic" },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  thumbPlaceholder: {
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  entryName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  entryMeta: { color: colors.calories, fontSize: 13, marginTop: 2, fontWeight: "600" },
  entryMacros: { color: colors.subtext, fontSize: 11, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 18, paddingHorizontal: 6 },
});
