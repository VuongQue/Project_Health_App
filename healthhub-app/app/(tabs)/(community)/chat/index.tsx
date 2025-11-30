import { Link } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { chatApi } from "@/src/api/chatApi";

// ==== TYPES ====
interface Participant {
  _id: string;
  fullName: string;
  avatar?: string;
}

interface ChatRoom {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
}

export default function ChatListScreen() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await chatApi.getRooms();
        setRooms(data);
      } catch (e) {
        console.log("Load rooms error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {rooms.map((room) => {
          const friend: Participant | undefined = room.participants[0];
          if (!friend) return null;

          return (
            <Link
              key={room._id}
              href={{
                pathname: "/(tabs)/(community)/chat/[id]",
                params: { id: room._id },
              }}
              asChild
            >
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                ]}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {friend.avatar || "👤"}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {friend.fullName}
                  </Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {room.lastMessage || "No messages yet"}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

// =============== STYLE SHEET ===============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  itemPressed: {
    backgroundColor: "#1e293b",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
  },
  infoBox: {
    flex: 1,
    marginLeft: 16,
  },
  friendName: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  lastMessage: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
});
