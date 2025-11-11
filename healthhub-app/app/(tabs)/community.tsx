import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Heart, MessageCircle, Share2, Award } from "lucide-react-native";

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  achievement?: string;
}

interface Leader {
  name: string;
  points: number;
  avatar: string;
}

const CommunityScreen: React.FC = () => {
  const posts: Post[] = [
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "👩",
      time: "2h ago",
      content:
        "Just completed my first 10K run! 🏃‍♀️ Feeling amazing and so grateful for this supportive community. Keep pushing everyone!",
      likes: 124,
      comments: 18,
      achievement: "First 10K",
    },
    {
      id: 2,
      author: "Mike Chen",
      avatar: "👨",
      time: "4h ago",
      content:
        "Week 3 of the 30-day challenge done! The morning workouts are getting easier. Who else is on this journey? 💪",
      likes: 89,
      comments: 12,
    },
    {
      id: 3,
      author: "Emma Davis",
      avatar: "👩‍🦰",
      time: "6h ago",
      content:
        "Meditation has changed my life. Started with just 5 minutes a day, now up to 20! 🧘‍♀️",
      likes: 156,
      comments: 24,
    },
  ];

  const leaderboard: Leader[] = [
    { name: "Jordan Lee", points: 2840, avatar: "🥇" },
    { name: "Taylor Swift", points: 2650, avatar: "🥈" },
    { name: "Morgan Park", points: 2420, avatar: "🥉" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.tabs}>
          {["Feed", "Following", "Trending"].map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={i === 0 ? styles.tabActive : styles.tab}
            >
              <Text style={i === 0 ? styles.tabTextActive : styles.tabText}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.leaderboard}>
        <View style={styles.leaderHeader}>
          <Award color="white" size={18} />
          <Text style={styles.leaderTitle}>Weekly Leaderboard</Text>
        </View>
        {leaderboard.map((user, i) => (
          <View key={i} style={styles.leaderItem}>
            <View style={styles.leaderUser}>
              <Text style={styles.leaderAvatar}>{user.avatar}</Text>
              <Text style={styles.leaderName}>{user.name}</Text>
            </View>
            <Text style={styles.leaderPoints}>{user.points} pts</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.leaderButton}>
          <Text style={styles.leaderButtonText}>View Full Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {/* Posts */}
      <View style={styles.posts}>
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{post.avatar}</Text>
              </View>
              <View style={styles.postInfo}>
                <Text style={styles.postAuthor}>{post.author}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              {post.achievement && (
                <View style={styles.badge}>
                  <Award color="#facc15" size={14} />
                  <Text style={styles.badgeText}>{post.achievement}</Text>
                </View>
              )}
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Heart color="#94a3b8" size={20} />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MessageCircle color="#94a3b8" size={20} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { marginLeft: "auto" }]}>
                <Share2 color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f172a", flex: 1 },
  header: { padding: 16 },
  title: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 8 },
  tab: { backgroundColor: "#1e293b", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  tabText: { color: "#94a3b8", fontSize: 14 },
  tabActive: { backgroundColor: "#2563eb", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  tabTextActive: { color: "white", fontSize: 14 },
  leaderboard: { backgroundColor: "#3b82f6", margin: 16, borderRadius: 24, padding: 16 },
  leaderHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  leaderTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  leaderItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 10, marginVertical: 4 },
  leaderUser: { flexDirection: "row", alignItems: "center", gap: 8 },
  leaderAvatar: { fontSize: 20 },
  leaderName: { color: "white" },
  leaderPoints: { color: "white" },
  leaderButton: { marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingVertical: 8, alignItems: "center" },
  leaderButtonText: { color: "white", fontSize: 14 },
  posts: { paddingHorizontal: 16, marginBottom: 24 },
  postCard: { backgroundColor: "#1e293b", borderRadius: 16, padding: 12, marginBottom: 12 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 20 },
  postInfo: { flex: 1, marginLeft: 8 },
  postAuthor: { color: "white", fontWeight: "600" },
  postTime: { color: "#94a3b8", fontSize: 12 },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(250,204,21,0.2)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
  badgeText: { color: "#facc15", fontSize: 12 },
  postContent: { color: "#cbd5e1", marginBottom: 8 },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 8, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { color: "#94a3b8", fontSize: 13 },
});
