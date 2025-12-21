import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";

import { Plus, MessageCircle, Search } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, router } from "expo-router";

import { StoryCircle } from "@/components/community/StoryCircle";
import { PostComposer } from "@/components/community/PostComposer";
import { PostCard } from "@/components/community/PostCard";

import { communityApi } from "@/src/api/communityApi";
import { profileApi } from "@/src/api/profileApi";
import { StoryItem, PostItem } from "@/src/types/community";

export default function CommunityFeed() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);

  /** LOAD PROFILE */
  const loadMyProfile = async () => {
    const res = await profileApi.getMe();
    setMyAvatar(res.data.user.avatarUrl ?? null);
  };

  /** LOAD FEED */
  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getFeed();
      setPosts(res.posts);
    } catch (e) {
      console.log("Feed load error", e);
    } finally {
      setLoading(false);
    }
  };

  /** LOAD STORIES */
  const loadStories = async () => {
    const res = await communityApi.getStories();

    const yourStory: StoryItem = {
      id: "your-story",
      user: {
        name: "Your Story",
        avatar: myAvatar,
      },
      hasStory: false,
      isYourStory: true,
      media: null,
      createdAt: new Date().toISOString(),
    };

    setStories([yourStory, ...(res || [])]);
  };

  /** UPLOAD STORY */
  const handleCreateStory = async () => {
    try {
      setUploadingStory(true);

      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (pick.canceled) return;

      await communityApi.uploadStory(pick.assets[0].uri);
      await loadStories();
    } finally {
      setUploadingStory(false);
    }
  };

  useEffect(() => {
    loadMyProfile();
  }, []);

  useEffect(() => {
    if (myAvatar) loadStories();
  }, [myAvatar]);

  /** 🔥 QUAN TRỌNG: reload feed khi quay lại từ CreatePost */
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>HealthHub Community</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton}>
              <Plus color="#94a3b8" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("(tabs)/(community)/chat" as any)}
            >
              <MessageCircle color="#94a3b8" size={20} />
              <View style={styles.badge} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Search color="#94a3b8" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stories.map((story) => (
            <StoryCircle
              key={story.id}
              story={story}
              uploadingStory={uploadingStory && story.isYourStory}
              onPress={handleCreateStory}
            />
          ))}
        </ScrollView>
      </View>

      {/* FEED */}
      <ScrollView
        style={styles.feedScroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadFeed} />
        }
      >
        {/* ✅ KHÔNG CÒN onPosted */}
        <PostComposer />

        {posts.map((post) => (
          <PostCard key={post._id} post={post} refresh={loadFeed} />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

  headerWrapper: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: { color: "white", fontSize: 24, fontWeight: "bold" },

  headerButtons: { flexDirection: "row", gap: 12 },

  iconButton: {
    padding: 10,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: "#2563eb",
    borderRadius: 99,
  },

  feedScroll: { paddingTop: 16 },
});
