import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { X } from "lucide-react-native";
import { StoryItem } from "@/src/types/community";
import { StoryProgressBar } from "./StoryProgressBar";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface Props {
  story: StoryItem;
  onNext: () => void;
  onPrev: () => void;
}

export function StoryViewer({ story, onNext, onPrev }: Props) {
  const router = useRouter();
  const duration = 4000;
  const [progress, setProgress] = useState(0);

  // auto progress
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          onNext();
        }
        return p + 2.5;
      });
    }, duration / 40);

    return () => clearInterval(interval);
  }, [story]);

  const imageUrl = story?.media?.[0] ?? null;

  return (
    <View style={styles.container}>
      {/* Image */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View
          style={[
            styles.image,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={{ color: "white" }}>No Image</Text>
        </View>
      )}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <StoryProgressBar progress={progress} />

        <View style={styles.userRow}>
          <Text style={styles.avatar}>{story.user.avatar || "👤"}</Text>
          <Text style={styles.name}>{story.user.name}</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X color="white" size={26} />
        </TouchableOpacity>
      </View>

      {/* Tap Areas */}
      <Pressable style={styles.left} onPress={onPrev} />
      <Pressable style={styles.right} onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: "black",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  topBar: {
    position: "absolute",
    top: 50,
    width: "100%",
    paddingHorizontal: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  avatar: {
    fontSize: 32,
    marginRight: 10,
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
  },
  left: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "40%",
    height: "100%",
  },
  right: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "60%",
    height: "100%",
  },
});
