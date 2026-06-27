import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { StoryViewer } from "@/components/community/StoryViewer";
import { communityApi } from "@/src/api/communityApi";

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [stories, setStories] = React.useState<any[]>([]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      const list = await communityApi.getStories();
      const startIndex = list.findIndex((s: any) => s.id === id);
      setStories(list);
      setIndex(startIndex >= 0 ? startIndex : 0);
    };
    load();
  }, [id]);

  const handleNext = () => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
    }
  };

  if (!stories.length) return null;

  return (
    <View style={styles.root}>
      <StoryViewer
        story={stories[index]}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
  },
});
