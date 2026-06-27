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
import { useColors, Radius } from "@/src/theme";

export function PostComposer() {
  const router = useRouter();
  const colors = useColors();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    profileApi.getMe().then((res) => {
      setAvatar(res.data.user.avatarUrl ?? null);
    });
  }, []);

  const myAvatar = avatar || "https://ui-avatars.com/api/?name=Me";

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        <Image source={{ uri: myAvatar }} style={styles.avatar} />

        <TouchableOpacity
          style={[styles.fakeInput, { backgroundColor: colors.bgInput }]}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/(community)/create-post" as any)}
        >
          <Text style={[styles.placeholder, { color: colors.textMuted }]}>Share your thoughts...</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
  },

  placeholder: {
    fontSize: 15,
  },
});
