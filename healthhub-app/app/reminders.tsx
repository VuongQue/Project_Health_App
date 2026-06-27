import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Bell, Dumbbell, Droplets, Moon, Clock, ChevronRight, ChevronLeft, Check } from "lucide-react-native";
import { reminderService, ReminderSettings } from "@/src/services/reminderService";
import { useRouter } from "expo-router";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 30, 45];
const WATER_INTERVALS = [1, 1.5, 2, 3, 4];

export default function RemindersScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReminderSettings>({
    workoutReminder: true,
    workoutHour: 7,
    workoutMinute: 0,
    waterReminder: true,
    waterIntervalHours: 2,
    sleepReminder: false,
    sleepHour: 22,
    sleepMinute: 0,
  });

  const [saved, setSaved] = useState(false);
  const [picker, setPicker] = useState<{
    visible: boolean;
    type: "workoutTime" | "sleepTime" | "waterInterval" | null;
  }>({ visible: false, type: null });

  useEffect(() => {
    reminderService.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await reminderService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert(
      "Đã lưu nhắc nhở",
      "Cài đặt nhắc nhở đã được lưu. Mở app mỗi ngày để nhận nhắc nhở.",
      [{ text: "Đã hiểu" }]
    );
  };

  const openPicker = (type: "workoutTime" | "sleepTime" | "waterInterval") => {
    setPicker({ visible: true, type });
  };

  const closePicker = () => setPicker({ visible: false, type: null });

  const handleHourSelect = (h: number) => {
    if (picker.type === "workoutTime") setSettings({ ...settings, workoutHour: h });
    else if (picker.type === "sleepTime") setSettings({ ...settings, sleepHour: h });
    closePicker();
  };

  const handleMinuteSelect = (m: number) => {
    if (picker.type === "workoutTime") setSettings({ ...settings, workoutMinute: m });
    else if (picker.type === "sleepTime") setSettings({ ...settings, sleepMinute: m });
    closePicker();
  };

  const handleWaterIntervalSelect = (h: number) => {
    setSettings({ ...settings, waterIntervalHours: h });
    closePicker();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>Nhắc nhở sức khoẻ</Text>
      </View>

      <Text style={styles.subtitle}>
        Cài đặt nhắc nhở để duy trì thói quen lành mạnh mỗi ngày.
      </Text>

      {/* Workout reminder */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#1e3a5f" }]}>
            <Dumbbell size={20} color="#3b82f6" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Nhắc nhở tập thể dục</Text>
            <Text style={styles.cardSub}>Nhắc bạn tập luyện mỗi ngày</Text>
          </View>
          <Switch
            value={settings.workoutReminder}
            onValueChange={(v) => setSettings({ ...settings, workoutReminder: v })}
            trackColor={{ false: "#334155", true: "#1d4ed8" }}
            thumbColor={settings.workoutReminder ? "#3b82f6" : "#94a3b8"}
          />
        </View>

        {settings.workoutReminder && (
          <View style={styles.cardContent}>
            <Text style={styles.fieldLabel}>Giờ nhắc</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker("workoutTime")}>
                <Clock size={14} color="#3b82f6" />
                <Text style={styles.timeText}>
                  {reminderService.formatTime(settings.workoutHour, settings.workoutMinute)}
                </Text>
                <ChevronRight size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Water reminder */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#0c2340" }]}>
            <Droplets size={20} color="#38bdf8" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Nhắc uống nước</Text>
            <Text style={styles.cardSub}>Duy trì đủ 2L nước/ngày</Text>
          </View>
          <Switch
            value={settings.waterReminder}
            onValueChange={(v) => setSettings({ ...settings, waterReminder: v })}
            trackColor={{ false: "#334155", true: "#0c4a6e" }}
            thumbColor={settings.waterReminder ? "#38bdf8" : "#94a3b8"}
          />
        </View>

        {settings.waterReminder && (
          <View style={styles.cardContent}>
            <Text style={styles.fieldLabel}>Nhắc mỗi</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker("waterInterval")}>
              <Droplets size={14} color="#38bdf8" />
              <Text style={styles.timeText}>{settings.waterIntervalHours} giờ</Text>
              <ChevronRight size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sleep reminder */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: "#1a1040" }]}>
            <Moon size={20} color="#a855f7" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Nhắc đi ngủ</Text>
            <Text style={styles.cardSub}>Giữ giờ ngủ đều đặn</Text>
          </View>
          <Switch
            value={settings.sleepReminder}
            onValueChange={(v) => setSettings({ ...settings, sleepReminder: v })}
            trackColor={{ false: "#334155", true: "#4c1d95" }}
            thumbColor={settings.sleepReminder ? "#a855f7" : "#94a3b8"}
          />
        </View>

        {settings.sleepReminder && (
          <View style={styles.cardContent}>
            <Text style={styles.fieldLabel}>Giờ nhắc</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker("sleepTime")}>
              <Clock size={14} color="#a855f7" />
              <Text style={styles.timeText}>
                {reminderService.formatTime(settings.sleepHour, settings.sleepMinute)}
              </Text>
              <ChevronRight size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info note */}
      <View style={styles.infoCard}>
        <Bell size={16} color="#facc15" />
        <Text style={styles.infoText}>
          Nhắc nhở sẽ hiển thị khi bạn mở ứng dụng. Để nhận thông báo đẩy khi app đóng, hãy cấp quyền thông báo trong cài đặt thiết bị.
        </Text>
      </View>

      {/* Save button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        {saved ? (
          <View style={styles.savedRow}>
            <Check size={18} color="white" />
            <Text style={styles.saveBtnText}>Đã lưu!</Text>
          </View>
        ) : (
          <Text style={styles.saveBtnText}>Lưu cài đặt</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Time picker modal */}
      <Modal visible={picker.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {picker.type === "waterInterval" ? "Chọn khoảng thời gian" : "Chọn giờ nhắc"}
              </Text>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.closeBtn}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {picker.type === "waterInterval" ? (
              <FlatList
                data={WATER_INTERVALS}
                keyExtractor={(i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      item === settings.waterIntervalHours && styles.pickerItemActive,
                    ]}
                    onPress={() => handleWaterIntervalSelect(item)}
                  >
                    <Text style={[styles.pickerItemText, item === settings.waterIntervalHours && styles.pickerItemTextActive]}>
                      Mỗi {item} giờ
                    </Text>
                    {item === settings.waterIntervalHours && <Check size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <>
                <Text style={styles.pickerSection}>Giờ</Text>
                <FlatList
                  horizontal
                  data={HOURS}
                  keyExtractor={(i) => `h-${i}`}
                  renderItem={({ item }) => {
                    const active = picker.type === "workoutTime" ? item === settings.workoutHour : item === settings.sleepHour;
                    return (
                      <TouchableOpacity
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        onPress={() => handleHourSelect(item)}
                      >
                        <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                          {item.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  style={{ marginBottom: 16 }}
                />
                <Text style={styles.pickerSection}>Phút</Text>
                <FlatList
                  horizontal
                  data={MINUTES}
                  keyExtractor={(i) => `m-${i}`}
                  renderItem={({ item }) => {
                    const active = picker.type === "workoutTime" ? item === settings.workoutMinute : item === settings.sleepMinute;
                    return (
                      <TouchableOpacity
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        onPress={() => handleMinuteSelect(item)}
                      >
                        <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                          {item.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: { padding: 4 },
  title: { color: "white", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#64748b", fontSize: 14, marginBottom: 24, lineHeight: 20 },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { color: "white", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#64748b", fontSize: 12, marginTop: 2 },
  cardContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#334155" },
  fieldLabel: { color: "#94a3b8", fontSize: 12, marginBottom: 8 },
  timeRow: { flexDirection: "row" },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timeText: { color: "white", fontSize: 16, fontWeight: "700", flex: 1 },

  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#1c1200",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#78350f",
    alignItems: "flex-start",
  },
  infoText: { color: "#fbbf24", fontSize: 12, flex: 1, lineHeight: 18 },

  saveBtn: { backgroundColor: "#3b82f6", borderRadius: 16, padding: 16, alignItems: "center" },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#1e293b", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  closeBtn: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },

  pickerSection: { color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: 10 },

  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#0f172a",
  },
  pickerItemActive: { backgroundColor: "#1e3a5f" },
  pickerItemText: { color: "#94a3b8", fontSize: 15 },
  pickerItemTextActive: { color: "white", fontWeight: "700" },

  timeChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timeChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  timeChipText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  timeChipTextActive: { color: "white" },
});
