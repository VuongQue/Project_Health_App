import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Send, Bot, User, AlertTriangle, Plus, History, Trash2, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import aiApi, { ChatMessage, ChatSession } from "@/src/api/aiApi";
import { Colors, Spacing, Radius, Typography } from "@/src/theme";

interface Message extends ChatMessage {
  id: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function toMessages(raw: { role: string; content: string }[]): Message[] {
  return raw.map((m, i) => ({ id: String(i), role: m.role as "user" | "assistant", content: m.content }));
}

export default function AiCoachScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const INIT_MESSAGE: Message = {
    id: "0",
    role: "assistant",
    content: t("ai.coach_greeting"),
  };

  const QUICK_PROMPTS = [
    t("ai.quick_1"),
    t("ai.quick_2"),
    t("ai.quick_3"),
    t("ai.quick_4"),
  ];

  const [messages, setMessages] = useState<Message[]>([INIT_MESSAGE]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await aiApi.getSessions();
      setSessions(res.data);
    } catch {}
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([INIT_MESSAGE]);
    setInput("");
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session._id);
    const msgs = toMessages(session.messages);
    setMessages(msgs.length > 0 ? msgs : [INIT_MESSAGE]);
    setShowHistory(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await aiApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (sessionId === currentSessionId) startNewSession();
    } catch {}
  };

  const openHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const res = await aiApi.getSessions();
      setSessions(res.data);
    } catch {} finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setLoading(true);

      try {
        const history = updated.map(({ role, content }) => ({ role, content }));
        const res = await aiApi.chat(history);
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.data.reply,
        };
        const finalMessages = [...updated, assistantMsg];
        setMessages(finalMessages);

        // Lưu lên backend
        const allMessages = finalMessages.map(({ role, content }) => ({ role, content }));
        if (currentSessionId) {
          await aiApi.saveMessages(currentSessionId, allMessages).catch(() => {});
        } else {
          const sessionRes = await aiApi.createSession(text.trim()).catch(() => null);
          if (sessionRes) {
            setCurrentSessionId(sessionRes.data._id);
            await aiApi.saveMessages(sessionRes.data._id, allMessages).catch(() => {});
            setSessions((prev) => [sessionRes.data, ...prev]);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: t("ai.err_connection") },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, loading, currentSessionId]
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && <View style={styles.avatar}><Bot size={16} color={Colors.primary} /></View>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
        {isUser && <View style={[styles.avatar, styles.avatarUser]}><User size={16} color="#fff" /></View>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <LinearGradient colors={["#1e3a5f", Colors.bgPrimary]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/(personal)")}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}><Bot size={20} color={Colors.primary} /></View>
          <View>
            <Text style={styles.headerTitle}>{t("ai.coach_title")}</Text>
            <Text style={styles.headerSub}>{t("ai.coach_subtitle")}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={openHistory}>
            <History size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={startNewSession}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <AlertTriangle size={13} color="#f59e0b" />
        <Text style={styles.disclaimerText}>{t("ai.disclaimer")}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.avatar}><Bot size={16} color={Colors.primary} /></View>
          <View style={styles.typingBubble}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>{t("ai.thinking")}</Text>
          </View>
        </View>
      )}

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <View style={styles.quickRow}>
          {QUICK_PROMPTS.map((q) => (
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}>
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi coach của bạn..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={300}
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <LinearGradient
            colors={input.trim() && !loading ? [Colors.primary, Colors.primaryDark] : [Colors.bgCard, Colors.bgCard]}
            style={styles.sendGradient}
          >
            <Send size={18} color={input.trim() && !loading ? "#fff" : Colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lịch sử trò chuyện</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.newSessionBtn} onPress={startNewSession}>
              <Plus size={16} color="#fff" />
              <Text style={styles.newSessionText}>Tạo cuộc trò chuyện mới</Text>
            </TouchableOpacity>

            {historyLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {sessions.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có lịch sử trò chuyện</Text>
                ) : (
                  sessions.map((s) => (
                    <TouchableOpacity
                      key={s._id}
                      style={[styles.sessionItem, s._id === currentSessionId && styles.sessionItemActive]}
                      onPress={() => loadSession(s)}
                    >
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>{s.title}</Text>
                        <Text style={styles.sessionDate}>
                          {formatDate(s.lastActiveAt)} · {s.messages.length} tin
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteSession(s._id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={15} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(59,130,246,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: Typography.md, fontWeight: "700" },
  headerSub: { color: Colors.textSecondary, fontSize: Typography.xs, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  disclaimer: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderBottomWidth: 1, borderBottomColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: Spacing.base, paddingVertical: 7,
  },
  disclaimerText: { color: "#f59e0b", fontSize: 11, flex: 1, lineHeight: 16 },
  msgList: { padding: Spacing.base, paddingBottom: 4 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  avatarUser: { backgroundColor: Colors.primary },
  bubble: { maxWidth: "75%", borderRadius: Radius.lg, padding: 12 },
  bubbleAi: { backgroundColor: Colors.bgCard, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { color: Colors.textPrimary, fontSize: Typography.sm, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: Spacing.base, paddingBottom: 8 },
  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: 10,
  },
  typingText: { color: Colors.textSecondary, fontSize: Typography.xs },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: Spacing.base, paddingBottom: 8 },
  quickChip: {
    backgroundColor: "rgba(59,130,246,0.12)", borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(59,130,246,0.25)",
  },
  quickChipText: { color: Colors.primaryLight, fontSize: Typography.xs },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 8,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: Typography.sm, maxHeight: 100,
  },
  sendBtn: { borderRadius: Radius.full },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 16, paddingHorizontal: Spacing.base, paddingBottom: 32,
    maxHeight: "75%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: "700" },
  newSessionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 12, paddingHorizontal: Spacing.base,
    marginBottom: 16, justifyContent: "center",
  },
  newSessionText: { color: "#fff", fontSize: Typography.sm, fontWeight: "600" },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: "center", marginTop: 24 },
  sessionItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.sm, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  sessionItemActive: { borderColor: Colors.primary, backgroundColor: "rgba(59,130,246,0.08)" },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: "600" },
  sessionDate: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  deleteBtn: { padding: 4 },
});
