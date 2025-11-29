import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator  } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StoryItem } from "@/src/types/community";
import { Plus } from "lucide-react-native";
import { useRouter } from "expo-router";

interface Props {
  story: StoryItem;
  onPress: () => void;
  uploadingStory?: boolean;
}

export function StoryCircle({ story, onPress, uploadingStory }: Props) {
  const isYour = story.isYourStory;
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.wrapper}
        onPress={() => {
        if (story.isYourStory) {
        onPress(); // upload story nếu của bạn
        } else {
        router.push({
            pathname: "/story/[id]",
            params: { id: story.id },
            });
        }
    }}>
      <View style={styles.container}>
        {story.isYourStory && uploadingStory && (
            <View style={styles.loadingCover}>
                <ActivityIndicator size="small" color="white" />
            </View>
            )}

        {/* Viền gradient */}
        <LinearGradient
          colors={isYour ? ["#64748b", "#94a3b8"] : ["#a855f7", "#ec4899"]}
          style={styles.gradient}
        >
          {/* Avatar */}
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{story.user.avatar}</Text>
          </View>
        </LinearGradient>

        {/* Icon + cho Your Story */}
        {isYour && (
          <View style={styles.plusWrapper}>
            <View style={styles.plusCircle}>
              <Plus size={14} color="white" />
            </View>
          </View>
        )}
      </View>

      <Text style={styles.name}>
        {isYour ? "Your Story" : story.user.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginRight: 14,
  },

  container: {
    width: 68,
    height: 68,
  },

  gradient: {
    width: "100%",
    height: "100%",
    padding: 3,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarBox: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 32,
  },

  plusWrapper: {
    position: "absolute",
    bottom: -2,
    right: -2,
  },

  plusCircle: {
    width: 20,
    height: 20,
    backgroundColor: "#2563eb",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0f172a",
  },

  name: {
    color: "white",
    fontSize: 12,
    marginTop: 6,
  },
  loadingCover: {
  position: "absolute",
  width: 68,
  height: 68,
  backgroundColor: "rgba(0,0,0,0.45)",
  borderRadius: 999,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},

});
