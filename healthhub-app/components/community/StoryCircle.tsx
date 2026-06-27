import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StoryItem } from "@/src/types/community";
import { Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/src/theme";

interface Props {
  story: StoryItem;
  onPress: () => void;
  uploadingStory?: boolean;
}

export function StoryCircle({ story, onPress, uploadingStory }: Props) {
  const isYour = story.isYourStory;
  const router = useRouter();
  const colors = useColors();

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={() => {
        if (isYour) onPress();
        else
          router.push({
            pathname: "/(tabs)/(community)/story/[id]",
            params: { id: story.id },
          });
      }}
    >
      <View style={styles.container}>
        {uploadingStory && (
          <View style={styles.loadingCover}>
            <ActivityIndicator color="white" />
          </View>
        )}

        <LinearGradient
          colors={isYour ? ["#64748b", "#94a3b8"] : ["#a855f7", "#ec4899"]}
          style={styles.gradient}
        >
          <View style={[styles.avatarBox, { backgroundColor: colors.bgCard }]}>
            {story.user.avatar ? (
              <Image
                source={{ uri: story.user.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
        </LinearGradient>

        {isYour && (
          <View style={styles.plusWrapper}>
            <View style={[styles.plusCircle, { borderColor: colors.bgPrimary }]}>
              <Plus size={14} color="white" />
            </View>
          </View>
        )}
      </View>

      <Text style={[styles.name, { color: colors.textSecondary }]}>
        {isYour ? "Story của tôi" : story.user.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginRight: 14 },
  container: { width: 68, height: 68 },
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
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarText: { fontSize: 32 },
  plusWrapper: { position: "absolute", bottom: -2, right: -2 },
  plusCircle: {
    width: 20,
    height: 20,
    backgroundColor: "#2563eb",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  name: { fontSize: 11, marginTop: 6, maxWidth: 68, textAlign: "center" },
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
