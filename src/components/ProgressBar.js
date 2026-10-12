import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

export default function ProgressBar({ label, value, goal, unit, color }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = value > goal;
  const remaining = Math.max(goal - value, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(value)} / {goal} {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : color },
          ]}
        />
      </View>
      <Text style={styles.remaining}>
        {over
          ? `${Math.round(value - goal)} ${unit} over goal`
          : `${Math.round(remaining)} ${unit} left`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: colors.text, fontSize: 16, fontWeight: "600" },
  value: { color: colors.subtext, fontSize: 14 },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cardAlt,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 6 },
  remaining: { color: colors.subtext, fontSize: 12, marginTop: 4 },
});
