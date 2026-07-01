import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from "react-native";
import { Bell, Dumbbell, Droplets, Moon, Clock, ChevronRight, ChevronLeft, Check } from "lucide-react-native";
import { reminderService, ReminderSettings } from "@/src/services/reminderService";
import { useRouter } from "expo-router";
import { useColors, Radius, Spacing, sf } from "@/src/theme";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 30, 45];
const WATER_INTERVALS = [1, 1.5, 2, 3, 4];

export default function RemindersScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<ReminderSettings>({
    workoutReminder: true, workoutHour: 7, workoutMinute: 0,
    waterReminder: true, waterIntervalHours: 2,
    sleepReminder: false, sleepHour: 22, sleepMinute: 0,
  });
  const [saved, setSaved] = useState(false);
  const [picker, setPicker] = useState<{ visible: boolean; type: "workoutTime" | "sleepTime" | "waterInterval" | null }>({ visible: false, type: null });

  useEffect(() => { reminderService.getSettings().then(setSettings); }, []);

  const handleSave = async () => {
    await reminderService.saveSettings(settings);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    Alert.alert("Đã lưu nhắc nhở", "Cài đặt nhắc nhở đã được lưu. Mở app mỗi ngày để nhận nhắc nhở.", [{ text: "Đã hiểu" }]);
  };

  const openPicker = (type: "workoutTime" | "sleepTime" | "waterInterval") => setPicker({ visible: true, type });
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

  const handleWaterIntervalSelect = (h: number) => { setSettings({ ...settings, waterIntervalHours: h }); closePicker(); };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgSecondary }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Nhắc nhở sức khoẻ</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Cài đặt nhắc nhở để duy trì thói quen lành mạnh mỗi ngày.</Text>

      {/* Workout */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
            <Dumbbell size={20} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Nhắc nhở tập thể dục</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Nhắc bạn tập luyện mỗi ngày</Text>
          </View>
          <Switch
            value={settings.workoutReminder}
            onValueChange={(v) => setSettings({ ...settings, workoutReminder: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="white"
          />
        </View>
        {settings.workoutReminder && (
          <View style={[styles.cardContent, { borderTopColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Giờ nhắc</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity style={[styles.timeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={() => openPicker("workoutTime")}>
                <Clock size={14} color={colors.primary} />
                <Text style={[styles.timeText, { color: colors.textPrimary }]}>{reminderService.formatTime(settings.workoutHour, settings.workoutMinute)}</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Water */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
            <Droplets size={20} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Nhắc uống nước</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Duy trì đủ 2L nước/ngày</Text>
          </View>
          <Switch
            value={settings.waterReminder}
            onValueChange={(v) => setSettings({ ...settings, waterReminder: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="white"
          />
        </View>
        {settings.waterReminder && (
          <View style={[styles.cardContent, { borderTopColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nhắc mỗi</Text>
            <TouchableOpacity style={[styles.timeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={() => openPicker("waterInterval")}>
              <Droplets size={14} color={colors.primary} />
              <Text style={[styles.timeText, { color: colors.textPrimary }]}>{settings.waterIntervalHours} giờ</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sleep */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: colors.purpleBg }]}>
            <Moon size={20} color={colors.purple} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Nhắc đi ngủ</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Giữ giờ ngủ đều đặn</Text>
          </View>
          <Switch
            value={settings.sleepReminder}
            onValueChange={(v) => setSettings({ ...settings, sleepReminder: v })}
            trackColor={{ false: colors.border, true: colors.purple }}
            thumbColor="white"
          />
        </View>
        {settings.sleepReminder && (
          <View style={[styles.cardContent, { borderTopColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Giờ nhắc</Text>
            <TouchableOpacity style={[styles.timeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={() => openPicker("sleepTime")}>
              <Clock size={14} color={colors.purple} />
              <Text style={[styles.timeText, { color: colors.textPrimary }]}>{reminderService.formatTime(settings.sleepHour, settings.sleepMinute)}</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.warningBg, borderColor: colors.border }]}>
        <Bell size={16} color={colors.warning} />
        <Text style={[styles.infoText, { color: colors.warning }]}>
          Nhắc nhở sẽ hiển thị khi bạn mở ứng dụng. Để nhận thông báo đẩy khi app đóng, hãy cấp quyền thông báo trong cài đặt thiết bị.
        </Text>
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
        {saved ? (
          <View style={styles.savedRow}><Check size={18} color="white" /><Text style={styles.saveBtnText}>Đã lưu!</Text></View>
        ) : (
          <Text style={styles.saveBtnText}>Lưu cài đặt</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <Modal visible={picker.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {picker.type === "waterInterval" ? "Chọn khoảng thời gian" : "Chọn giờ nhắc"}
              </Text>
              <TouchableOpacity onPress={closePicker}>
                <Text style={[styles.closeBtn, { color: colors.primary }]}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {picker.type === "waterInterval" ? (
              <FlatList
                data={WATER_INTERVALS} keyExtractor={(i) => i.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, { backgroundColor: colors.bgSecondary }, item === settings.waterIntervalHours && { backgroundColor: colors.primaryBg }]}
                    onPress={() => handleWaterIntervalSelect(item)}
                  >
                    <Text style={[styles.pickerItemText, { color: colors.textSecondary }, item === settings.waterIntervalHours && { color: colors.textPrimary, fontWeight: "700" }]}>
                      Mỗi {item} giờ
                    </Text>
                    {item === settings.waterIntervalHours && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <>
                <Text style={[styles.pickerSection, { color: colors.textSecondary }]}>Giờ</Text>
                <FlatList
                  horizontal data={HOURS} keyExtractor={(i) => `h-${i}`}
                  renderItem={({ item }) => {
                    const active = picker.type === "workoutTime" ? item === settings.workoutHour : item === settings.sleepHour;
                    return (
                      <TouchableOpacity
                        style={[styles.timeChip, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => handleHourSelect(item)}
                      >
                        <Text style={[styles.timeChipText, { color: colors.textSecondary }, active && { color: "white" }]}>
                          {item.toString().padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  style={{ marginBottom: 16 }}
                />
                <Text style={[styles.pickerSection, { color: colors.textSecondary }]}>Phút</Text>
                <FlatList
                  horizontal data={MINUTES} keyExtractor={(i) => `m-${i}`}
                  renderItem={({ item }) => {
                    const active = picker.type === "workoutTime" ? item === settings.workoutMinute : item === settings.sleepMinute;
                    return (
                      <TouchableOpacity
                        style={[styles.timeChip, { backgroundColor: colors.bgSecondary, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => handleMinuteSelect(item)}
                      >
                        <Text style={[styles.timeChipText, { color: colors.textSecondary }, active && { color: "white" }]}>
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
  container: { flex: 1, padding: Spacing.base },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, paddingTop: 52 },
  backBtn: { padding: 4 },
  title: { fontSize: sf(22), fontWeight: "800" },
  subtitle: { fontSize: sf(14), marginBottom: 24, lineHeight: 20 },
  card: { borderRadius: Radius.xl, padding: 18, marginBottom: 14, borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: Radius.lg, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: sf(15), fontWeight: "700" },
  cardSub: { fontSize: sf(12), marginTop: 2 },
  cardContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  fieldLabel: { fontSize: sf(12), marginBottom: 8 },
  timeRow: { flexDirection: "row" },
  timeBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  timeText: { fontSize: sf(16), fontWeight: "700", flex: 1 },
  infoCard: { flexDirection: "row", gap: 10, borderRadius: Radius.lg, padding: 14, marginBottom: 20, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: sf(12), flex: 1, lineHeight: 18 },
  saveBtn: { borderRadius: Radius.lg, padding: 16, alignItems: "center" },
  saveBtnText: { color: "white", fontSize: sf(16), fontWeight: "700" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: sf(18), fontWeight: "700" },
  closeBtn: { fontSize: sf(15), fontWeight: "600" },
  pickerSection: { fontSize: sf(12), fontWeight: "600", marginBottom: 10 },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: Radius.md, marginBottom: 6 },
  pickerItemText: { fontSize: sf(15) },
  timeChip: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: "center", alignItems: "center", marginRight: 8, borderWidth: 1 },
  timeChipText: { fontSize: sf(14), fontWeight: "600" },
});
