import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Search, MessageCircle, UserPlus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { friendApi } from "@/src/api/friendApi";
import { chatApi } from "@/src/api/chatApi";
import { router } from "expo-router";

export default function FriendsPage() {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [suggest, setSuggest] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /** LOAD DATA */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [fList, suggestList, pendingList] = await Promise.all([
        friendApi.getFriends(),
        friendApi.suggest(),
        friendApi.getPending(),
      ]);

      setFriends(fList);
      setSuggest(suggestList);
      setPending(pendingList);
    } catch (err) {
      console.log("Load friends failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /** SEARCH */
  const onSearch = async (text: string) => {
    setSearch(text);

    if (text.trim() === "") {
      loadData();
      return;
    }

    try {
      const res = await friendApi.search(text);
      setSuggest(res);
    } catch (err) {
      console.log("Search:", err);
    }
  };

  /** ADD FRIEND */
  const onAddFriend = async (targetId: number) => {
    try {
      await friendApi.sendRequest(targetId);
      alert("Friend request sent!");
      loadData();
    } catch (err) {
      alert("Failed to send request");
    }
  };

  /** ACCEPT / REJECT FRIEND REQUEST */
  const onRespond = async (requestId: string, accept: boolean) => {
    try {
      await friendApi.respond(requestId, accept);
      loadData();
    } catch (err) {
      alert("Failed to respond");
    }
  };

  /** ----------------------------------------------
   *  OPEN CHAT WITH FRIEND (FINAL)
   * ---------------------------------------------- */
  const openChat = async (friend: any) => {
    try {
      const res = await chatApi.openChat({
        receiverId: String(friend.id),
      });

      router.push({
        pathname: "/(tabs)/(community)/chat/[id]",
        params: { id: res.roomId },
      });
    } catch (err) {
      console.log("Open chat error:", err);
      alert("Failed to open chat");
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Text style={styles.headerSubtitle}>
          Connect with people who share your journey
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ marginBottom: 30 }}>
        <View style={styles.inputWrapper}>
          <Search size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search friends..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={onSearch}
          />
        </View>
      </View>

      {/* Your Friends */}
      <View style={{ marginBottom: 30 }}>
        <Text style={styles.sectionTitle}>Your Friends</Text>

        {friends.map((u) => (
          <View key={u.id} style={styles.card}>
            <LinearGradient colors={["#3b82f6", "#8b5cf6"]} style={styles.avatar}>
              <Text style={{ fontSize: 26 }}>😊</Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.fullName}</Text>
              <Text style={styles.username}>@{u.username}</Text>
            </View>

            <TouchableOpacity style={styles.msgBtn} onPress={() => openChat(u)}>
              <MessageCircle size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Suggested Friends */}
      <View style={{ marginBottom: 80 }}>
        <Text style={styles.sectionTitle}>People You May Know</Text>

        {suggest.map((u) => (
          <View key={u.id} style={styles.card}>
            <LinearGradient colors={["#3b82f6", "#8b5cf6"]} style={styles.avatar}>
              <Text style={{ fontSize: 26 }}>👤</Text>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.fullName}</Text>
              <Text style={styles.username}>@{u.username}</Text>
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAddFriend(u.id)}
            >
              <UserPlus size={18} color="white" />
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  loading: {
    flex: 1, backgroundColor: "#0f172a",
    justifyContent: "center", alignItems: "center"
  },
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 24,
  },
  headerTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#94a3b8",
    marginTop: 4,
  },
  inputWrapper: { position: "relative" },
  searchIcon: {
    position: "absolute",
    top: "50%",
    left: 16,
    marginTop: -10,
  },
  searchInput: {
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingLeft: 48,
    paddingRight: 16,
    borderRadius: 24,
    borderColor: "#334155",
    borderWidth: 1,
    color: "white",
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 24,
    borderColor: "#334155",
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  name: { color: "white", fontSize: 16 },
  username: { color: "#94a3b8", fontSize: 12 },
  msgBtn: {
    padding: 10,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  addText: { color: "white", fontSize: 14 },
});
