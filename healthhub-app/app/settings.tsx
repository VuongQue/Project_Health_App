import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Bot, Moon, Sun, Bell, Shield, Info, Mic, MicOff, BookOpen } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useCompanion } from "@/src/context/CompanionContext";
import { useTour, resetTour } from "@/src/context/TourContext";
import { resetAllScreenTours, ALL_SCREEN_TOUR_IDS } from "@/src/context/ScreenTourContext";

function SettingRow({
  icon,
  label,
  subtitle,
  right,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border + "55" }]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle && <Text style={[styles.rowSub, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, toggleTheme, colors } = useTheme();
  const isDark = theme === "dark";
  const { enabled: companionEnabled, toggleEnabled: toggleCompanion, ttsEnabled, toggleTts } = useCompanion();
  const { startTour } = useTour();

  const handleStartTour = async () => {
    await resetTour();
    startTour();
  };

  const handleReplayScreenTours = async () => {
    await resetAllScreenTours(ALL_SCREEN_TOUR_IDS);
    Alert.alert(
      'Đã đặt lại hướng dẫn',
      'Lần sau khi vào mỗi màn hình, hướng dẫn chi tiết sẽ hiện lại tự động.',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.headerRow, { paddingTop: 52 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.textSub }]} numberOfLines={1}>{t("settings.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>{t("settings.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* APPEARANCE */}
      <Text style={[styles.section, { color: colors.textMuted }]}>{t("settings.section_appearance")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          colors={colors}
          icon={isDark ? <Moon size={18} color={colors.accent} /> : <Sun size={18} color="#f59e0b" />}
          label={isDark ? t("settings.theme_dark") : t("settings.theme_light")}
          subtitle={isDark ? t("settings.theme_dark_sub") : t("settings.theme_light_sub")}
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#334155", true: "#2563eb" }}
              thumbColor="white"
            />
          }
        />
      </View>

      {/* AI COMPANION */}
      <Text style={[styles.section, { color: colors.textMuted }]}>{t("settings.section_ai")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          colors={colors}
          icon={<Bot size={18} color={companionEnabled ? "#4F8EF7" : colors.textSub} />}
          label={t("settings.companion_label")}
          subtitle={companionEnabled ? t("settings.companion_on") : t("settings.companion_off")}
          right={
            <Switch
              value={companionEnabled}
              onValueChange={toggleCompanion}
              trackColor={{ false: "#334155", true: "#2563eb" }}
              thumbColor="white"
            />
          }
        />
        {companionEnabled && (
          <SettingRow
            colors={colors}
            icon={ttsEnabled ? <Mic size={18} color="#4F8EF7" /> : <MicOff size={18} color={colors.textSub} />}
            label={t("settings.tts_label")}
            subtitle={ttsEnabled ? t("settings.tts_on") : t("settings.tts_off")}
            right={
              <Switch
                value={ttsEnabled}
                onValueChange={toggleTts}
                trackColor={{ false: "#334155", true: "#2563eb" }}
                thumbColor="white"
              />
            }
          />
        )}
      </View>

      {/* NOTIFICATIONS */}
      <Text style={[styles.section, { color: colors.textMuted }]}>{t("settings.section_notifications")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push("/reminders" as any)}>
          <SettingRow
            colors={colors}
            icon={<Bell size={18} color={colors.accent} />}
            label={t("settings.reminders_label")}
            subtitle={t("settings.reminders_sub")}
          />
        </TouchableOpacity>
      </View>

      {/* APP TOUR */}
      <Text style={[styles.section, { color: colors.textMuted }]}>{t("settings.section_guide")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleStartTour}>
          <SettingRow
            colors={colors}
            icon={<BookOpen size={18} color={colors.accent} />}
            label={t("settings.tour_label")}
            subtitle={t("settings.tour_sub")}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReplayScreenTours}>
          <SettingRow
            colors={colors}
            icon={<BookOpen size={18} color="#34D399" />}
            label="Xem lại hướng dẫn từng màn hình"
            subtitle="Hướng dẫn chi tiết sẽ hiện lại khi bạn vào mỗi màn hình"
          />
        </TouchableOpacity>
      </View>

      {/* ABOUT */}
      <Text style={[styles.section, { color: colors.textMuted }]}>{t("settings.section_about")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          colors={colors}
          icon={<Info size={18} color={colors.textSub} />}
          label="HealthHub"
          subtitle={t("settings.app_version")}
        />
        <SettingRow
          colors={colors}
          icon={<Shield size={18} color={colors.textSub} />}
          label={t("settings.privacy_policy")}
          subtitle={t("settings.privacy_sub")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  back: { width: 70 },
  backText: { fontSize: 14 },
  header: { flex: 1, fontSize: 20, fontWeight: "bold", textAlign: "center" },
  section: { fontSize: 11, fontWeight: "600", letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 6 },
  card: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderBottomWidth: 1, borderBottomColor: "#33415533",
    gap: 12,
  },
  rowIcon: { width: 32, alignItems: "center" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSub: { fontSize: 12, marginTop: 1 },
  rowRight: {},
});
