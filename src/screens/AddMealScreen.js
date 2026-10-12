import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme";
import { FoodDatabase } from "../core/FoodDatabase";
import { GeminiService } from "../core/GeminiService";
import { NutritionMath } from "../core/Nutrition";

export default function AddMealScreen({ preferredIds, apiKey, onLog, onCancel }) {
  const [photo, setPhoto] = useState(null);
  const [base64, setBase64] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");

  const results = useMemo(() => {
    const list = FoodDatabase.instance.search(query);
    // Surface preferred foods first when not actively searching.
    if (!query.trim() && preferredIds?.length) {
      const pref = list.filter((f) => preferredIds.includes(f.id));
      const rest = list.filter((f) => !preferredIds.includes(f.id));
      return [...pref, ...rest];
    }
    return list;
  }, [query, preferredIds]);

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access in Settings to snap meals.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (!res.canceled) {
      setPhoto(res.assets[0].uri);
      setBase64(res.assets[0].base64 || null);
    }
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
    if (!res.canceled) {
      setPhoto(res.assets[0].uri);
      setBase64(res.assets[0].base64 || null);
    }
  }

  async function analyze() {
    if (!apiKey) {
      Alert.alert(
        "No API key",
        "Add a free Gemini API key in Settings to auto-analyze photos. You can still pick the food manually below."
      );
      return;
    }
    if (!base64) {
      Alert.alert("No photo", "Take or attach a photo first, then tap Analyze.");
      return;
    }
    setAnalyzing(true);
    setAnalyzeStatus("");
    try {
      const r = await new GeminiService(apiKey).analyzeMealPhoto(base64, () =>
        setAnalyzeStatus("Gemini is busy — retrying…")
      );
      // Present the AI result as an editable, selectable "food" (serving = 1).
      setSelected({
        id: "ai",
        name: r.name,
        serving: "AI estimate",
        cal: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber,
        sugar: r.sugar,
      });
      setQty(1);
    } catch (e) {
      Alert.alert("Couldn't analyze", e.message || "Something went wrong.", [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: analyze },
      ]);
    } finally {
      setAnalyzing(false);
      setAnalyzeStatus("");
    }
  }

  function confirmLog() {
    if (!selected) return;
    onLog({
      name: selected.name,
      ...NutritionMath.scale(selected, qty), // cal + all macro keys, scaled by servings
      qty,
      photo,
      foodId: selected.id,
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Log a meal</Text>
        <TouchableOpacity onPress={onCancel} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Photo */}
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={{ fontSize: 40 }}>📷</Text>
          <Text style={styles.placeholderText}>Snap or attach a photo of your meal</Text>
        </View>
      )}
      <View style={styles.photoBtns}>
        <TouchableOpacity style={styles.smallBtn} onPress={takePhoto}>
          <Text style={styles.smallBtnText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={pickPhoto}>
          <Text style={styles.smallBtnText}>From library</Text>
        </TouchableOpacity>
      </View>

      {/* AI analyze */}
      {photo && (
        <TouchableOpacity
          style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
          onPress={analyze}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <ActivityIndicator color="#04283a" />
              <Text style={styles.analyzeText}>  {analyzeStatus || "Analyzing photo…"}</Text>
            </>
          ) : (
            <Text style={styles.analyzeText}>✨  Analyze with AI</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Quick confirm */}
      <Text style={styles.h2}>{selected?.id === "ai" ? "AI estimate" : "What is it?"}</Text>
      <TextInput
        style={styles.search}
        placeholder="Search foods…"
        placeholderTextColor={colors.subtext}
        value={query}
        onChangeText={setQuery}
      />

      {!selected &&
        results.slice(0, 12).map((f) => (
          <TouchableOpacity key={f.id} style={styles.foodRow} onPress={() => setSelected(f)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>
                {preferredIds?.includes(f.id) ? "★ " : ""}
                {f.name}
              </Text>
              <Text style={styles.foodMeta}>
                {f.serving} · {f.cal} kcal · {f.protein} g protein
              </Text>
            </View>
            <Text style={styles.pick}>Pick</Text>
          </TouchableOpacity>
        ))}

      {/* Selected + quantity */}
      {selected && (
        <View style={styles.selectedCard}>
          <Text style={styles.foodName}>{selected.name}</Text>
          <Text style={styles.foodMeta}>{selected.serving} per serving</Text>

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Servings</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.max(0.5, +(q - 0.5).toFixed(1)))}
              >
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => +(q + 0.5).toFixed(1))}
              >
                <Text style={styles.stepText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.total}>= {Math.round((selected.cal || 0) * qty)} kcal</Text>
          <Text style={styles.totalMacros}>
            P {Math.round((selected.protein || 0) * qty)}g · C{" "}
            {Math.round((selected.carbs || 0) * qty)}g · F{" "}
            {Math.round((selected.fat || 0) * qty)}g · Fiber{" "}
            {Math.round((selected.fiber || 0) * qty)}g · Sugar{" "}
            {Math.round((selected.sugar || 0) * qty)}g
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.changeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logBtn} onPress={confirmLog}>
              <Text style={styles.logText}>Add to today</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  h2: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 22, marginBottom: 10 },
  cancel: { color: colors.subtext, fontSize: 15 },
  photo: { width: "100%", height: 200, borderRadius: 16 },
  photoPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: colors.subtext, marginTop: 8 },
  photoBtns: { flexDirection: "row", gap: 12, marginTop: 12 },
  smallBtn: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  smallBtnText: { color: colors.text, fontWeight: "600" },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.protein,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeText: { color: "#04283a", fontWeight: "800", fontSize: 15 },
  search: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodName: { color: colors.text, fontSize: 15, fontWeight: "600" },
  foodMeta: { color: colors.subtext, fontSize: 13, marginTop: 2 },
  pick: { color: colors.accent, fontWeight: "700" },
  selectedCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  qtyLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.text, fontSize: 22, fontWeight: "700" },
  qtyVal: { color: colors.text, fontSize: 18, fontWeight: "700", minWidth: 40, textAlign: "center" },
  total: { color: colors.accent, fontSize: 16, fontWeight: "700", marginTop: 16 },
  totalMacros: { color: colors.subtext, fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  changeBtn: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  changeText: { color: colors.text, fontWeight: "700" },
  logBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logText: { color: "#04283a", fontWeight: "800" },
});
