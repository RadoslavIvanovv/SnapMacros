import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/theme";
import TodayScreen from "./src/screens/TodayScreen";
import AddMealScreen from "./src/screens/AddMealScreen";
import SuggestScreen from "./src/screens/SuggestScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { StorageService } from "./src/core/StorageService";

const storage = StorageService.instance;

const TABS = [
  { key: "today", label: "Today", icon: "🍽️" },
  { key: "suggest", label: "Ideas", icon: "💡" },
  { key: "settings", label: "Settings", icon: "⚙️" },
];

export default function App() {
  const [tab, setTab] = useState("today");
  const [adding, setAdding] = useState(false);

  const [goals, setGoalsState] = useState({ calories: 2200, protein: 150 });
  const [entries, setEntries] = useState([]);
  const [preferred, setPreferred] = useState([]);
  const [apiKey, setApiKeyState] = useState("");
  const [profile, setProfileState] = useState({
    weight: "",
    weightUnit: "kg",
    height: "",
    age: "",
    sex: "male",
    activity: "light",
    goal: "maintain",
  });

  const dayKey = storage.todayKey();

  const refresh = useCallback(async () => {
    setGoalsState(await storage.getGoals());
    setEntries(await storage.getLogsForDay(dayKey));
    setPreferred(await storage.getPreferred());
    setApiKeyState(await storage.getApiKey());
    setProfileState(await storage.getProfile());
  }, [dayKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleLog(entry) {
    await storage.addLogEntry(dayKey, entry);
    setEntries(await storage.getLogsForDay(dayKey));
    setAdding(false);
    setTab("today");
  }

  async function handleQuickLog(food) {
    await storage.addLogEntry(dayKey, {
      name: food.name,
      cal: food.cal || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      qty: 1,
      foodId: food.id,
    });
    setEntries(await storage.getLogsForDay(dayKey));
    setTab("today");
  }

  async function handleRemove(id) {
    await storage.removeLogEntry(dayKey, id);
    setEntries(await storage.getLogsForDay(dayKey));
  }

  async function handleSaveGoals(g) {
    await storage.setGoals(g);
    setGoalsState(g);
  }

  async function handleTogglePreferred(id) {
    setPreferred(await storage.togglePreferred(id));
  }

  async function handleSaveApiKey(k) {
    await storage.setApiKey(k);
    setApiKeyState(k);
  }

  async function handleSaveProfile(pr) {
    await storage.setProfile(pr);
    setProfileState(pr);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.body}>
        {adding ? (
          <AddMealScreen
            preferredIds={preferred}
            apiKey={apiKey}
            onLog={handleLog}
            onCancel={() => setAdding(false)}
          />
        ) : tab === "today" ? (
          <TodayScreen
            goals={goals}
            entries={entries}
            onRemove={handleRemove}
            onAdd={() => setAdding(true)}
          />
        ) : tab === "suggest" ? (
          <SuggestScreen
            goals={goals}
            entries={entries}
            preferredIds={preferred}
            apiKey={apiKey}
            profile={profile}
            onQuickLog={handleQuickLog}
          />
        ) : (
          <SettingsScreen
            goals={goals}
            onSaveGoals={handleSaveGoals}
            preferredIds={preferred}
            onTogglePreferred={handleTogglePreferred}
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            profile={profile}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </View>

      {!adding && (
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  body: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: colors.subtext, fontSize: 12, marginTop: 2 },
  tabLabelActive: { color: colors.accent, fontWeight: "700" },
});
