import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { profileApi } from "@/src/api/profileApi";

export function PostComposer() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    profileApi.getMe().then((res) => {
      setAvatar(res.data.user.avatarUrl ?? null);
    });
  }, []);

  const myAvatar =
    avatar || "https://ui-avatars.com/api/?name=Me";

  return (
  <View style={styles.wrapper}>
    <View style={styles.card}>
      <Image source={{ uri: myAvatar }} style={styles.avatar} />

      <TouchableOpacity
        style={styles.fakeInput}
        activeOpacity={0.8}
        onPress={() => router.push("/(community)/create-post" as any)}
      >
        <Text style={styles.placeholder}>Share your thoughts...</Text>
      </TouchableOpacity>
    </View>
  </View>
);

}


const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    marginRight: 12,
  },

  fakeInput: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  placeholder: {
    color: "#94a3b8",
    fontSize: 15,
  },
});


