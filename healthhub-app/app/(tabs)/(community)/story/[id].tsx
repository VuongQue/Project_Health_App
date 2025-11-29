import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StoryViewer } from "@/components/community/StoryViewer";
import { communityApi } from "@/src/api/communityApi";

export default function StoryScreen() {
  const { id } = useLocalSearchParams();
  const [stories, setStories] = React.useState<any[]>([]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      const list = await communityApi.getStories();

      // tìm đúng story
      const arr = list.filter((s: any) => s.id === id);

      // nếu muốn xem cả stories liền kề
      // const currentIndex = list.findIndex((s) => s.id === id);
      // setStories(list);
      // setIndex(currentIndex);

      setStories(arr);
    };
    load();
  }, [id]);

  if (!stories.length) return null;

  return (
    <StoryViewer
      story={stories[index]}
      onNext={() => setIndex((i) => Math.min(i + 1, stories.length - 1))}
      onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
    />
  );
}
