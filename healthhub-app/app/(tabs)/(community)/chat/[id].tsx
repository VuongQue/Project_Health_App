import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowLeft, Send } from "lucide-react-native";
import { chatApi } from "@/src/api/chatApi";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { createSocket } from "@/src/socket/socket";

export default function ChatDetail() {
  const { id } = useLocalSearchParams(); // roomId param
  const roomId = id ? String(id) : "";

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<any>(null);

  /* ---------- LOAD CURRENT USER ---------- */
  useEffect(() => {
    (async () => {
        const u = await getUserFromToken();
        console.log("[ChatDetail] user =", u);

        if (u?.id) {
        setCurrentUserId(String(u.id));
        }
    })();
    }, []);


  /* ---------- LOAD OLD MESSAGES ---------- */
  useEffect(() => {
    if (!roomId) {
      console.log("[ChatDetail] skip load messages because roomId empty");
      return;
    }

    const load = async () => {
      console.log("[ChatDetail] load messages for roomId =", roomId);
      const data = await chatApi.getMessages(roomId);
      console.log("[ChatDetail] messages from API =", data);

      const clean = data
        .filter((m: any) => m.text !== "__init__")
        .map((m: any) => ({
          ...m,
          senderId: String(m.senderId),
          roomId: String(m.roomId),
        }));
      console.log("[ChatDetail] messages after map =", clean);
      setMessages(clean);
    };

    load();
  }, [roomId]);

  /* ---------- SOCKET REALTIME ---------- */
  useEffect(() => {
    // cần có cả currentUserId và roomId
    if (!roomId || !currentUserId) {
      console.log(
        "[ChatDetail] skip socket setup, roomId =",
        roomId,
        ", currentUserId =",
        currentUserId
      );
      return;
    }

    console.log(
      "[ChatDetail] setup socket for roomId =",
      roomId,
      ", currentUserId =",
      currentUserId
    );

    let isMounted = true;

    const setupSocket = async () => {
      const s = await createSocket();
      if (!isMounted) {
        console.log("[ChatDetail] socket created but component unmounted");
        return;
      }

      socketRef.current = s;
      console.log("[ChatDetail] socket connected id =", s.id);

      // join room
      console.log("[ChatDetail] emit joinRoom with roomId =", roomId);
      s.emit("joinRoom", { roomId });

      // log event connect / disconnect (socket.io client)
      s.on("connect", () => {
        console.log("[ChatDetail][socket] connect, id =", s.id);
      });

      s.on("disconnect", (reason: any) => {
        console.log("[ChatDetail][socket] disconnect, reason =", reason);
      });

      // lắng nghe tin nhắn mới
      s.on("message", (raw: any) => {
        console.log("[ChatDetail][socket] received raw message =", raw);
        const msg = {
          ...raw,
          senderId: String(raw.senderId),
          roomId: String(raw.roomId),
        };
        console.log(
          "[ChatDetail][socket] normalized msg =",
          msg,
          " | current roomId =",
          roomId
        );

        if (msg.roomId !== roomId) {
          console.log(
            "[ChatDetail][socket] ❌ roomId mismatch, ignore message"
          );
          return;
        }

        setMessages((prev) => {
          const next = [...prev, msg];
          console.log("[ChatDetail] messages after push =", next);
          return next;
        });
      });
    };

    setupSocket();

    return () => {
      console.log("[ChatDetail] cleanup socket effect");
      isMounted = false;
      if (socketRef.current) {
        console.log("[ChatDetail] disconnect socket");
        socketRef.current.off("message");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, currentUserId]);

  /* ---------- SEND MESSAGE (qua socket) ---------- */
  const sendMsg = () => {
    if (!input.trim()) {
      console.log("[ChatDetail] sendMsg -> empty input, skip");
      return;
    }

    if (!socketRef.current) {
      console.log("[ChatDetail] sendMsg -> socketRef.current is null");
      return;
    }

    if (!roomId) {
      console.log("[ChatDetail] sendMsg -> roomId empty");
      return;
    }

    const payload = {
      roomId,
      text: input.trim(),
    };

    console.log("[ChatDetail] emit sendMessage payload =", payload);
    socketRef.current.emit("sendMessage", payload);
    setInput("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={26} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* CHAT LIST */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={{ paddingBottom: 12 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => {
          const isMe = String(msg.senderId) === String(currentUserId);

          // log 1 số message để check lệch trái/phải
          console.log(
            `[ChatDetail][render] msg[${index}] senderId =`,
            msg.senderId,
            "| currentUserId =",
            currentUserId,
            "| isMe =",
            isMe
          );

          return (
            <View
              key={index}
              style={[
                styles.messageRow,
                isMe ? styles.messageRowRight : styles.messageRowLeft,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMe ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Message..."
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            style={styles.input}
          />

          <Pressable onPress={sendMsg} style={styles.sendBtn}>
            <Send size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
  },
  backBtn: { padding: 6 },
  headerTitle: {
    color: "white",
    fontSize: 18,
    marginLeft: 12,
    fontWeight: "600",
  },

  chatScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },

  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: "#2563eb",
    borderTopRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 0,
  },

  messageText: {
    color: "white",
    fontSize: 15,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
    borderTopWidth: 1,
  },

  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    color: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  sendBtn: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
});
