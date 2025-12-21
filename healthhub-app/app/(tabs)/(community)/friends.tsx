import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Search, MessageCircle, UserPlus, Check, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { friendApi } from "@/src/api/friendApi";
import { chatApi } from "@/src/api/chatApi";
import { router } from "expo-router";
import { useNotificationSocket } from "@/src/realtime/useNotificationSocket";

interface UserItem {
  id: number;
  fullName: string;
  username: string;
  avatarUrl?: string;
}

interface FriendRequest {
  id: string;
  fromUser: UserItem;
  toUser?: UserItem;
}

export default function FriendsPage() {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [suggest, setSuggest] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔔 realtime friend request
  useNotificationSocket({
    onFriendRequest: () => loadData(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        friendList,
        receivedReq,
        sentReq,
        suggestList,
      ] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getReceivedRequests(),
        friendApi.getSentRequests(),
        friendApi.suggest(),
      ]);

      setFriends(friendList);
      setReceived(receivedReq);
      setSent(sentReq);

      // ❗ lọc suggest
      const excludeIds = new Set<number>([
        ...friendList.map((u: UserItem) => u.id),
        ...receivedReq.map((r: FriendRequest) => r.fromUser.id),
        ...sentReq.map((r: FriendRequest) => r.toUser!.id),
      ]);

      setSuggest(suggestList.filter((u: UserItem) => !excludeIds.has(u.id)));
    } catch (err) {
      console.log("Load friends failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onAddFriend = async (id: number) => {
    await friendApi.sendRequest(id);
    loadData();
  };

  const onRespond = async (requestId: string, accept: boolean) => {
    await friendApi.respond(requestId, accept);
    loadData();
  };

  const openChat = async (friend: UserItem) => {
    const res = await chatApi.openChat({ receiverId: String(friend.id) });
    router.push({
      pathname: "/(tabs)/(community)/chat/[id]",
      params: { id: res.roomId },
    });
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
      {/* HEADER */}
      <Text style={styles.headerTitle}>Friends</Text>
      <Text style={styles.headerSubtitle}>
        Connect with people who share your journey
      </Text>

      {/* SEARCH */}
      <View style={styles.inputWrapper}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* FRIEND REQUESTS */}
      {received.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          {received.map((r) => (
            <View key={r.id} style={styles.card}>
              <Avatar user={r.fromUser} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.fromUser.fullName}</Text>
                <Text style={styles.username}>@{r.fromUser.username}</Text>
              </View>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => onRespond(r.id, true)}
              >
                <Check size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => onRespond(r.id, false)}
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* FRIEND LIST */}
      <Text style={styles.sectionTitle}>Your Friends</Text>
      {friends.map((u) => (
        <View key={u.id} style={styles.card}>
          <Avatar user={u} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{u.fullName}</Text>
            <Text style={styles.username}>@{u.username}</Text>
          </View>

          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => openChat(u)}
          >
            <MessageCircle size={18} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      ))}

      {/* SUGGEST */}
      <Text style={styles.sectionTitle}>People You May Know</Text>
      {suggest.map((u) => (
        <View key={u.id} style={styles.card}>
          <Avatar user={u} />
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
    </ScrollView>
  );
}

/* ---------------- AVATAR ---------------- */
function Avatar({ user }: { user: UserItem }) {
  return (
    <View style={styles.avatar}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
      ) : (
        <LinearGradient
          colors={["#3b82f6", "#8b5cf6"]}
          style={styles.avatarFallback}
        >
          <Text style={styles.avatarText}>
            {user.fullName.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}


/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
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
    marginRight: 14,
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
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

  acceptBtn: {
    padding: 10,
    backgroundColor: "#22c55e",
    borderRadius: 10,
    marginRight: 6,
  },
  
  rejectBtn: {
    padding: 10,
    backgroundColor: "#ef4444",
    borderRadius: 10,
  },
  
});
