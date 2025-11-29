import React, { useEffect, useState } from "react";
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

import { StoryCircle } from "@/components/community/StoryCircle";
import { PostComposer } from "@/components/community/PostComposer";
import { PostCard } from "@/components/community/PostCard";

import { communityApi } from "@/src/api/communityApi";
import { StoryItem, PostItem } from "@/src/types/community";

export default function CommunityFeed() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);

  /** LOAD POSTS */
  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getFeed();
      setPosts(res.posts);
    } catch (error) {
      console.error("Feed load error:", error);
    } finally {
      setLoading(false);
    }
  };

  /** LOAD STORIES */
  const loadStories = async () => {
  try {
    const res = await communityApi.getStories();

    // Nếu không có story nào trong DB → vẫn hiển thị "Your Story"
    if (!res || res.length === 0) {
      setStories([
        {
          id: "your-story",
          user: {
            name: "Your Story",
            avatar: "👤", // hoặc icon
          },
          hasStory: false,
          isYourStory: true,
          media: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    // Nếu có story thì thêm Your Story vào đầu danh sách
    setStories([
      {
        id: "your-story",
        user: {
          name: "Your Story",
          avatar: "👤",
        },
        hasStory: false,
        isYourStory: true,
        media: null,
        createdAt: new Date().toISOString(),
      },
      ...res,
    ]);
  } catch (error) {
    console.error("Story load error:", error);
  }
};
  

  /** UPLOAD STORY */
  const handleCreateStory = async () => {
    try {
      setUploadingStory(true); // bật loading

      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (pick.canceled) return;

      await communityApi.uploadStory(pick.assets[0].uri);

      loadStories();
    } catch (err) {
      console.log("Upload story error:", err);
    } finally {
      setUploadingStory(false); // tắt loading
    }
  };

  useEffect(() => {
    loadFeed();
    loadStories();
  }, []);

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

            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle color="#94a3b8" size={20} />
              <View style={styles.badge} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <Search color="#94a3b8" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storyRow}
        >
          {stories?.map((story) => (
            <StoryCircle
              key={story.id}
              story={story}
              onPress={() => {
                if (story.isYourStory) handleCreateStory();
                else console.log("View story:", story.id);
              }}
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
        <PostComposer onPosted={loadFeed} />

        {posts.map((post) => (
          <PostCard key={post._id} post={post} refresh={loadFeed} />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  headerWrapper: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    backgroundColor: "#0f172a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
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
  storyRow: {
    paddingBottom: 4,
    marginTop: 10,
  },
  feedScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
