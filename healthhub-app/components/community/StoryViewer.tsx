import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { X, Send } from "lucide-react-native";
import { StoryItem } from "@/src/types/community";
import { StoryProgressBar } from "./StoryProgressBar";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const QUICK_REACTIONS = ["❤️", "😮", "😂", "😢", "👏", "🔥"];

interface Props {
  story: StoryItem;
  onNext: () => void;
  onPrev: () => void;
}

export function StoryViewer({ story, onNext, onPrev }: Props) {
  const router = useRouter();
  const duration = 4000;
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const reactionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProgress(0);
    setSentReaction(null);
  }, [story]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          onNext();
          return 100;
        }
        return p + 2.5;
      });
    }, duration / 40);

    return () => clearInterval(interval);
  }, [story, paused]);

  const handleReaction = (emoji: string) => {
    setSentReaction(emoji);
    reactionAnim.setValue(0);
    Animated.sequence([
      Animated.timing(reactionAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(reactionAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSentReaction(null));
  };

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: gửi message qua API
    setMessage("");
    setPaused(false);
  };

  const imageUrl = story?.media?.[0] ?? null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background image */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, { backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "white", fontSize: 18 }}>No Image</Text>
        </View>
      )}

      <StatusBar hidden />

      {/* Dark gradient overlay top */}
      <View style={styles.topGradient} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <StoryProgressBar progress={progress} />

        <View style={styles.userRow}>
          <View style={styles.avatarCircle}>
            {story.user.avatar ? (
              <Image
                source={{ uri: story.user.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarFallback}>
                {story.user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.name}>{story.user.name}</Text>
            <Text style={styles.timeAgo}>Vừa xong</Text>
          </View>
        </View>

        {/* Close button — rendered last so it's on top of tap areas */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Tap Areas — chỉ phủ vùng giữa màn hình, không đụng top bar và bottom bar */}
      <View style={styles.tapZone} pointerEvents="box-none">
        <Pressable style={styles.left} onPress={onPrev} />
        <Pressable style={styles.right} onPress={onNext} />
      </View>

      {/* Reaction float */}
      {sentReaction && (
        <Animated.View
          style={[
            styles.reactionFloat,
            {
              opacity: reactionAnim,
              transform: [
                {
                  translateY: reactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -40],
                  }),
                },
                { scale: reactionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.4, 1] }) },
              ],
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>{sentReaction}</Text>
        </Animated.View>
      )}

      {/* Bottom — dark gradient overlay */}
      <View style={styles.bottomGradient} />

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {/* Quick reactions */}
        <View style={styles.reactionsRow}>
          {QUICK_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionBtn}
              onPress={() => handleReaction(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Trả lời ${story.user.name}...`}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={message}
            onChangeText={setMessage}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, message.trim() ? styles.sendBtnActive : {}]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Send size={18} color={message.trim() ? "#fff" : "rgba(255,255,255,0.4)"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: "black",
  },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  // Gradient overlays
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  avatarFallback: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  name: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  timeAgo: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 30,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tap zones — chỉ phủ vùng giữa, không đụng header/footer
  tapZone: {
    position: "absolute",
    top: 160,
    left: 0,
    right: 0,
    bottom: 160,
    flexDirection: "row",
    zIndex: 5,
  },
  left: {
    flex: 4,
    height: "100%",
  },
  right: {
    flex: 6,
    height: "100%",
  },

  // Reaction float
  reactionFloat: {
    position: "absolute",
    bottom: 180,
    alignSelf: "center",
    zIndex: 20,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  reactionEmoji: {
    fontSize: 22,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 16,
    color: "white",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sendBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
});
