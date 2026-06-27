import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  TouchableOpacity,
} from "react-native";
import { ArrowLeft, Send, Phone, Video } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { chatApi } from "@/src/api/chatApi";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { createSocket } from "@/src/socket/socket";
import { useColors, Spacing, Radius } from "@/src/theme";
import { useTranslation } from "react-i18next";

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  roomId: string;
  createdAt?: string;
  status?: "sent" | "delivered" | "read";
}

function timeLabel(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dateSeparator(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ChatDetail() {
  const colors = useColors();
  const { t } = useTranslation();
  const { id, friendName, friendAvatar } = useLocalSearchParams<{
    id: string; friendName?: string; friendAvatar?: string;
  }>();
  const roomId = id ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const typingTimer = useRef<any>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getUserFromToken().then((u) => { if (u?.id) setCurrentUserId(String(u.id)); });
  }, []);

  useEffect(() => {
    if (!roomId) return;
    chatApi.getMessages(roomId).then((data) => {
      const clean: Message[] = data
        .filter((m: any) => m.text !== "__init__")
        .map((m: any) => ({ ...m, senderId: String(m.senderId), roomId: String(m.roomId) }));
      setMessages(clean);
    });
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !currentUserId) return;
    let mounted = true;

    createSocket().then((s) => {
      if (!mounted) return;
      socketRef.current = s;
      s.emit("joinRoom", { roomId });

      s.on("message", (raw: any) => {
        const msg: Message = { ...raw, senderId: String(raw.senderId), roomId: String(raw.roomId) };
        if (msg.roomId !== roomId) return;
        setMessages((prev) => [...prev, msg]);
      });

      s.on("typing", (data: { userId: string; roomId: string }) => {
        if (data.roomId !== roomId || data.userId === currentUserId) return;
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
      });
    });

    return () => {
      mounted = false;
      clearTimeout(typingTimer.current);
      if (socketRef.current) {
        socketRef.current.off("message");
        socketRef.current.off("typing");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.stopAnimation();
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (socketRef.current && roomId) {
      socketRef.current.emit("typing", { roomId });
    }
  };

  const sendMsg = () => {
    if (!input.trim() || !socketRef.current || !roomId) return;
    socketRef.current.emit("sendMessage", { roomId, text: input.trim() });
    setInput("");
  };

  const displayName = friendName || "Chat";
  const initials = displayName.charAt(0).toUpperCase();

  type ListItem = ({ type: "msg" } & Message) | { type: "sep"; label: string; key: string };

  const listData: ListItem[] = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const sep = dateSeparator(msg.createdAt);
    const prevSep = prev ? dateSeparator(prev.createdAt) : null;
    if (sep && sep !== prevSep) {
      listData.push({ type: "sep", label: sep, key: `sep-${i}` });
    }
    listData.push({ type: "msg", ...msg });
  });

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === "sep") {
      return (
        <View style={styles.dateSep}>
          <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{item.label}</Text>
          <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
        </View>
      );
    }

    const msg = item as Message;
    const isMe = msg.senderId === currentUserId;
    const nextItem = listData[index + 1];
    const showTime = !nextItem || nextItem.type !== "msg" || (nextItem as Message).senderId !== msg.senderId;

    return (
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          friendAvatar ? (
            <Image source={{ uri: friendAvatar }} style={styles.msgAvatar} />
          ) : (
            <LinearGradient colors={["#2563eb", "#7c3aed"]} style={[styles.msgAvatar, styles.msgAvatarFallback]}>
              <Text style={styles.msgAvatarText}>{initials}</Text>
            </LinearGradient>
          )
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : [styles.theirBubble, { backgroundColor: colors.bgCard, borderColor: colors.border }]]}>
          <Text style={[styles.msgText, { color: colors.textSecondary }, isMe && styles.msgTextMe]}>{msg.text}</Text>
        </View>
        {isMe && <View style={styles.msgAvatarPlaceholder} />}
        {showTime && msg.createdAt && (
          <Text style={[styles.msgTime, { color: colors.textMuted }, isMe ? { alignSelf: "flex-end", marginRight: 8 } : { marginLeft: 8 }]}>
            {timeLabel(msg.createdAt)}
            {isMe ? "  ✓✓" : ""}
          </Text>
        )}
      </View>
    );
  }, [currentUserId, friendAvatar, initials, listData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <LinearGradient colors={["#0f1729", "#131d35"]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.75}>
          {friendAvatar ? (
            <Image source={{ uri: friendAvatar }} style={styles.headerAvatar} />
          ) : (
            <LinearGradient colors={["#2563eb", "#7c3aed"]} style={[styles.headerAvatar, styles.headerAvatarFallback]}>
              <Text style={styles.headerAvatarText}>{initials}</Text>
            </LinearGradient>
          )}
          <View>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{displayName}</Text>
            {isTyping ? (
              <Animated.Text style={[styles.typingText, { color: colors.textMuted, opacity: typingAnim }]}>
                {t("chat.typing")}
              </Animated.Text>
            ) : (
              <Text style={styles.headerStatus}>● Online</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <Pressable style={[styles.headerAction, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
            <Phone size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable style={[styles.headerAction, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
            <Video size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* MESSAGES */}
      <FlatList
        ref={flatRef}
        data={listData}
        keyExtractor={(item, i) => (item.type === "sep" ? item.key : (item._id ?? String(i)))}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* TYPING INDICATOR */}
      {isTyping && (
        <View style={[styles.typingBubble, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[styles.dot, {
                  opacity: typingAnim,
                  transform: [{ translateY: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                }]}
              />
            ))}
          </View>
        </View>
      )}

      {/* INPUT */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.inputBar, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}>
          <TextInput
            placeholder={t("chat.input_placeholder")}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={handleInputChange}
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgInput, borderColor: colors.border }]}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMsg}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMsg}
            disabled={!input.trim()}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          >
            {input.trim() ? (
              <LinearGradient colors={["#2563eb", "#7c3aed"]} style={styles.sendGradient}>
                <Send size={17} color="white" />
              </LinearGradient>
            ) : (
              <View style={[styles.sendGradient, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                <Send size={17} color={colors.textMuted} />
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  headerAvatarFallback: { justifyContent: "center", alignItems: "center" },
  headerAvatarText: { color: "white", fontWeight: "bold", fontSize: 15 },
  headerName: { fontWeight: "700", fontSize: 16 },
  headerStatus: { color: "#22c55e", fontSize: 11, marginTop: 1 },
  typingText: { fontSize: 11, fontStyle: "italic", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerAction: {
    width: 36, height: 36, justifyContent: "center", alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  listContent: { paddingHorizontal: 14, paddingVertical: 14 },

  dateSep: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginVertical: 14, paddingHorizontal: 4,
  },
  dateLine: { flex: 1, height: 1 },
  dateLabel: { fontSize: 12 },

  row: { marginBottom: 2, flexDirection: "column" },
  rowLeft: { alignItems: "flex-start" },
  rowRight: { alignItems: "flex-end" },

  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    position: "absolute", bottom: 0, left: 0,
  },
  msgAvatarFallback: { justifyContent: "center", alignItems: "center" },
  msgAvatarText: { color: "white", fontSize: 11, fontWeight: "bold" },
  msgAvatarPlaceholder: { width: 28 },

  bubble: {
    maxWidth: "75%",
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20,
    marginBottom: 1,
  },
  myBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
    marginLeft: 28,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
    marginLeft: 36,
    borderWidth: 1,
  },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTextMe: { color: "white" },
  msgTime: { fontSize: 11, marginTop: 1, marginBottom: 6, paddingHorizontal: 4 },

  typingBubble: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 14,
    marginBottom: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  typingDots: { flexDirection: "row", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#5E7A94" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 22, fontSize: 15,
    borderWidth: 1, maxHeight: 120,
  },
  sendBtn: { borderRadius: 22, overflow: "hidden" },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
});
