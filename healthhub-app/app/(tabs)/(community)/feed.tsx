import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  MessageCircle, Search, X, Users, Calendar, Newspaper,
  Plus, UserPlus, CheckCircle, Image as ImageIcon, Bell,
} from "lucide-react-native";
import { useColors, Spacing, Radius, sw, sf } from "@/src/theme";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, router } from "expo-router";
import { useScreenTour, useScreenTourStep } from "@/src/context/ScreenTourContext";

import { StoryCircle } from "@/components/community/StoryCircle";
import { PostCard } from "@/components/community/PostCard";

import { communityApi } from "@/src/api/communityApi";
import { friendApi } from "@/src/api/friendApi";
import { profileApi } from "@/src/api/profileApi";
import axiosClient from "@/src/api/axiosClient";
import { StoryItem, PostItem } from "@/src/types/community";
import { getUserFromToken } from "@/src/utils/tokenStorage";
import { simpleCache } from "@/src/utils/simpleCache";

type Tab = "posts" | "events" | "groups";

export default function CommunityFeed() {
  const colors = useColors();
  const { t } = useTranslation();
  const { startScreenTour } = useScreenTour();
  const tourStartedRef = useRef(false);
  const step0 = useScreenTourStep(0); // Stories row
  const step1 = useScreenTourStep(1); // Tabs (posts/events/groups)
  const step2 = useScreenTourStep(2); // Composer

  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PostItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [composerMedia, setComposerMedia] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [friendsPosts, setFriendsPosts] = useState<any[]>([]);
  const searchTimer = useRef<any>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    (async () => {
      // Profile: cache 5 phút (cùng key với profile screen)
      const cached = simpleCache.get<any>("profile:me");
      if (cached) {
        setMyAvatar(cached.user?.avatarUrl ?? null);
      } else {
        profileApi.getMe().then((res) => {
          simpleCache.set("profile:me", res.data, 2 * 60_000);
          setMyAvatar(res.data.user?.avatarUrl ?? null);
        }).catch(() => {});
      }
      const u = await getUserFromToken();
      if (u?.id) setCurrentUserId(String(u.id));
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    // Unread count: cache 30 giây để tránh spam khi chuyển tab
    const cached = simpleCache.get<number>("notif:unread");
    if (cached !== null) {
      setUnreadNotif(cached);
      return;
    }
    axiosClient.get("/notifications/unread-count")
      .then((r) => {
        const count = r.data?.count ?? r.data ?? 0;
        simpleCache.set("notif:unread", count, 30_000);
        setUnreadNotif(count);
      })
      .catch(() => {});
  }, []));

  useEffect(() => {
    if (myAvatar !== undefined) loadStories();
  }, [myAvatar]);

  const loadFeed = async (reset = true) => {
    try {
      if (reset) setLoading(true);
      const res = await communityApi.getFeed(1, PAGE_SIZE);
      setPosts(res.posts ?? []);
      setPage(1);
      setHasMore((res.posts?.length ?? 0) >= PAGE_SIZE);
    } catch (e) {
      console.log("Feed error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await communityApi.getFeed(nextPage, PAGE_SIZE);
      const newPosts: PostItem[] = res.posts ?? [];
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p._id));
        return [...prev, ...newPosts.filter((p) => !ids.has(p._id))];
      });
      setPage(nextPage);
      setHasMore(newPosts.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadEvents = async (forceRefresh = false) => {
    try {
      const cached = !forceRefresh && simpleCache.get<any[]>("community:events");
      if (cached) { setEvents(cached); return; }
      const res = await communityApi.getEvents();
      const data = Array.isArray(res) ? res : [];
      simpleCache.set("community:events", data, 3 * 60_000);
      setEvents(data);
    } catch {}
  };

  const loadGroups = async (forceRefresh = false) => {
    try {
      const cached = !forceRefresh && simpleCache.get<{ groups: any[]; myGroups: string[] }>("community:groups");
      if (cached) { setGroups(cached.groups); setMyGroups(cached.myGroups); return; }
      const [all, mine] = await Promise.all([
        communityApi.getGroups(),
        communityApi.getMyGroups(),
      ]);
      const groups = all.groups ?? [];
      const myGroups = (mine as any[]).map((g: any) => g._id);
      simpleCache.set("community:groups", { groups, myGroups }, 3 * 60_000);
      setGroups(groups);
      setMyGroups(myGroups);
    } catch {}
  };

  const loadStories = async (forceRefresh = false) => {
    const cached = !forceRefresh && simpleCache.get<StoryItem[]>("community:stories");
    if (cached) {
      // Cập nhật avatar của your-story nếu đã đổi
      setStories([{ ...cached[0], user: { name: "Your Story", avatar: myAvatar } }, ...cached.slice(1)]);
      return;
    }
    const res = await communityApi.getStories();
    const yourStory: StoryItem = {
      id: "your-story",
      user: { name: "Your Story", avatar: myAvatar },
      hasStory: false,
      isYourStory: true,
      media: null,
      createdAt: new Date().toISOString(),
    };
    const list = [yourStory, ...(res || [])];
    simpleCache.set("community:stories", list, 60_000);
    setStories(list);
  };

  const loadFriendsPosts = async (forceRefresh = false) => {
    try {
      const cached = !forceRefresh && simpleCache.get<any[]>("community:friendsPosts");
      if (cached) { setFriendsPosts(cached); return; }
      const friends = await friendApi.getFriends();
      const list = friends?.friends ?? friends ?? [];
      const ids: string[] = list.map((f: any) => String(f.friend?.id ?? f.friendId ?? f.id)).filter(Boolean);
      if (!ids.length) return;
      const posts = await communityApi.getFriendsFeed(ids, 6);
      simpleCache.set("community:friendsPosts", posts, 2 * 60_000);
      setFriendsPosts(posts);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed();
      loadEvents();
      loadGroups();
      loadFriendsPosts();
    }, [])
  );

  useEffect(() => {
    if (!loading && !tourStartedRef.current) {
      tourStartedRef.current = true;
      startScreenTour('community', [
        {
          id: 'stories',
          placement: 'bottom',
          icon: '📸',
          title: 'Story của bạn bè',
          body: 'Nhấn vào vòng tròn đầu tiên (Your Story) để đăng story ảnh. Nhấn vào story người khác để xem. Story tự biến mất sau 24h.',
        },
        {
          id: 'tabs',
          placement: 'bottom',
          icon: '📋',
          title: 'Bài đăng · Sự kiện · Nhóm',
          body: 'Chuyển tab để xem sự kiện sức khoẻ trong cộng đồng hoặc tham gia nhóm theo chủ đề (chạy bộ, yoga, giảm cân...).',
        },
        {
          id: 'composer',
          placement: 'bottom',
          icon: '✍️',
          title: 'Đăng bài chia sẻ',
          body: 'Nhấn vào đây để viết bài và đính kèm ảnh. Chia sẻ tiến độ tập luyện, recipe healthy, hoặc hỏi bạn bè!',
        },
      ]);
    }
  }, [loading]);

  const handleCreateStory = async () => {
    try {
      setUploadingStory(true);
      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (pick.canceled) return;
      await communityApi.uploadStory(pick.assets[0].uri);
      simpleCache.delete("community:stories");
      await loadStories(true);
    } finally {
      setUploadingStory(false);
    }
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await communityApi.searchPosts(q);
        setSearchResults(res.posts ?? []);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const pickComposerImage = async () => {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (pick.canceled) return;
    setComposerMedia((prev) => [...prev, ...pick.assets.map((a) => a.uri)].slice(0, 4));
  };

  const submitPost = async () => {
    if (!composerText.trim() && composerMedia.length === 0) return;
    setPosting(true);
    try {
      let mediaUrls: string[] = [];
      if (composerMedia.length > 0) {
        mediaUrls = await communityApi.uploadMultiple(composerMedia);
      }
      await communityApi.createPost({ content: composerText.trim(), media: mediaUrls });
      setComposerText("");
      setComposerMedia([]);
      await loadFeed();
    } catch {
    } finally {
      setPosting(false);
    }
  };

  const handleRegisterEvent = async (eventId: number) => {
    try {
      await communityApi.registerEvent(eventId);
      loadEvents();
    } catch {}
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await communityApi.joinGroup(groupId);
      loadGroups();
    } catch {}
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "posts", label: t("community.tab_posts"), icon: Newspaper },
    { key: "events", label: t("community.tab_events"), icon: Calendar },
    { key: "groups", label: t("community.tab_groups"), icon: Users },
  ];

  const ListHeader = () => (
    <>
      {/* STORIES */}
      <FlatList
        ref={step0.ref}
        onLayout={step0.measure}
        horizontal
        data={stories}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StoryCircle
            story={item}
            uploadingStory={uploadingStory && item.isYourStory}
            onPress={handleCreateStory}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}
        style={styles.storiesRow}
      />

      {/* FRIENDS ACTIVITY WIDGET */}
      {friendsPosts.length > 0 && (
        <View style={[styles.friendsWidget, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.friendsWidgetHeader}>
            <View style={styles.friendsWidgetTitleRow}>
              <View style={styles.friendsWidgetDot} />
              <Text style={[styles.friendsWidgetTitle, { color: colors.textPrimary }]}>Bạn bè đang chia sẻ</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/(community)/friends" as any)}>
              <Text style={styles.friendsWidgetSeeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {friendsPosts.slice(0, 3).map((p) => (
            <TouchableOpacity
              key={p._id}
              style={[styles.friendsPostRow, { borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/(tabs)/(community)/posts/[id]", params: { id: p._id } } as any)}
              activeOpacity={0.8}
            >
              {p.user?.avatar ? (
                <Image source={{ uri: p.user.avatar }} style={styles.friendsAvatar} />
              ) : (
                <View style={[styles.friendsAvatar, { backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: sf(12) }}>{(p.user?.name ?? "?").charAt(0)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.friendsPostName, { color: colors.textPrimary }]}>{p.user?.name}</Text>
                <Text style={[styles.friendsPostContent, { color: colors.textSecondary }]} numberOfLines={2}>{p.content}</Text>
              </View>
              {p.media?.[0] && <Image source={{ uri: p.media[0] }} style={styles.friendsThumb} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* TABS */}
      <View
        ref={step1.ref}
        onLayout={step1.measure}
        style={[styles.tabs, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && { backgroundColor: colors.primaryBg }]}
            onPress={() => setActiveTab(key)}
          >
            <Icon size={14} color={activeTab === key ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === key ? colors.primary : colors.textMuted }, activeTab === key && { fontWeight: "700" }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INLINE COMPOSER */}
      {activeTab === "posts" && (
        <View
          ref={step2.ref}
          onLayout={step2.measure}
          style={[styles.composer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        >
          <View style={styles.composerRow}>
            {myAvatar ? (
              <Image source={{ uri: myAvatar }} style={styles.composerAvatar} />
            ) : (
              <LinearGradient colors={["#2563eb", "#7c3aed"]} style={styles.composerAvatar} />
            )}
            <TextInput
              style={[styles.composerInput, { color: colors.textPrimary }]}
              value={composerText}
              onChangeText={setComposerText}
              placeholder={t("community.compose_placeholder")}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
          </View>

          {composerMedia.length > 0 && (
            <View style={styles.composerMediaRow}>
              {composerMedia.map((uri, i) => (
                <View key={i} style={styles.composerThumb}>
                  <Image source={{ uri }} style={styles.composerThumbImg} />
                  <TouchableOpacity
                    style={styles.composerThumbX}
                    onPress={() => setComposerMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.composerActions}>
            <TouchableOpacity style={styles.composerActionBtn} onPress={pickComposerImage}>
              <ImageIcon size={16} color="#60a5fa" />
              <Text style={styles.composerActionText}>Ảnh</Text>
            </TouchableOpacity>
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{composerText.length}/500</Text>
            <TouchableOpacity
              style={[
                styles.postBtn,
                (!composerText.trim() && composerMedia.length === 0) && styles.postBtnDisabled,
              ]}
              onPress={submitPost}
              disabled={posting || (!composerText.trim() && composerMedia.length === 0)}
            >
              {posting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postBtnText}>{t("community.post_button")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "events" && (
        <View style={styles.listPad}>
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có sự kiện nào.</Text>
            </View>
          ) : (
            events.map((ev) => (
              <EventCard key={ev.id} event={ev} onRegister={() => handleRegisterEvent(ev.id)} />
            ))
          )}
        </View>
      )}

      {activeTab === "groups" && (
        <View style={styles.listPad}>
          <TouchableOpacity
            style={styles.createGroupBtn}
            onPress={() => router.push("/(tabs)/(community)/groups/create" as any)}
          >
            <LinearGradient colors={["#2563eb", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createGroupGradient}>
              <Plus size={18} color="white" />
              <Text style={styles.createGroupText}>Tạo nhóm mới</Text>
            </LinearGradient>
          </TouchableOpacity>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có nhóm nào.</Text>
            </View>
          ) : (
            groups.map((g) => (
              <GroupCard
                key={g._id}
                group={g}
                isMember={myGroups.includes(g._id)}
                onJoin={() => handleJoinGroup(g._id)}
                onOpen={() =>
                  router.push({ pathname: "/(tabs)/(community)/groups/[id]", params: { id: g._id } } as any)
                }
              />
            ))
          )}
        </View>
      )}
    </>
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("community.title")}</Text>
        </View>

        <View style={styles.headerBtns}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]} onPress={() => setSearchVisible((v) => !v)}>
            {searchVisible
              ? <X color="#60a5fa" size={18} />
              : <Search color={colors.textSecondary} size={18} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/(community)/chat" as any)}
          >
            <MessageCircle color={colors.textSecondary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/(community)/alerts" as any)}
          >
            <Bell color={unreadNotif > 0 ? "#f87171" : colors.textSecondary} size={18} />
            {unreadNotif > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotif > 99 ? "99+" : unreadNotif}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      {searchVisible && (
        <View style={[styles.searchBar, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm kiếm bài viết..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      )}

      {/* SEARCH RESULTS */}
      {searchVisible && searchQuery.trim() ? (
        <FlatList
          data={searching ? [] : searchResults}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => (
            <PostCard post={item} refresh={loadFeed} currentUserId={currentUserId} />
          )}
          ListEmptyComponent={
            !searching ? (
              <Text style={styles.emptyText}>Không tìm thấy kết quả cho "{searchQuery}"</Text>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        <FlatList
          data={activeTab === "posts" ? posts : []}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => (
            <PostCard post={item} refresh={loadFeed} currentUserId={currentUserId} />
          )}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={
            activeTab === "posts" && !loading ? (
              <View style={styles.emptyState}>
                <Newspaper size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("community.no_posts")}</Text>
              </View>
            ) : null
          }
          onEndReached={activeTab === "posts" ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                simpleCache.deleteByPrefix("community:");
                simpleCache.delete("notif:unread");
                loadFeed();
                loadEvents(true);
                loadGroups(true);
                loadStories(true);
                loadFriendsPosts(true);
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

/* ── EVENT CARD ── */
function EventCard({ event, onRegister }: { event: any; onRegister: () => void }) {
  const colors = useColors();
  const start = new Date(event.startTime);
  const dateStr = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
  const timeStr = start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={cardStyles.eventHeader}>
        <LinearGradient colors={["#2563eb", "#7c3aed"]} style={cardStyles.datePill}>
          <Text style={cardStyles.dateDay}>{start.getDate()}</Text>
          <Text style={cardStyles.dateMonth}>
            {start.toLocaleDateString("vi-VN", { month: "short" }).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={cardStyles.typeBadge}>
            <Calendar size={11} color="#60a5fa" />
            <Text style={cardStyles.typeText}>{event.type?.toUpperCase() ?? "EVENT"}</Text>
          </View>
          <Text style={[cardStyles.title, { color: colors.textPrimary }]}>{event.title}</Text>
          <Text style={[cardStyles.sub, { color: colors.textSecondary }]}>{dateStr} · {timeStr}</Text>
        </View>
      </View>
      {event.link ? (
        <Text style={cardStyles.link} numberOfLines={1}>{event.link}</Text>
      ) : null}
      <TouchableOpacity style={cardStyles.joinBtn} onPress={onRegister}>
        <LinearGradient colors={["#2563eb", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cardStyles.joinGradient}>
          <Text style={cardStyles.joinText}>Đăng ký tham gia</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* ── GROUP CARD ── */
function GroupCard({
  group, isMember, onJoin, onOpen,
}: {
  group: any; isMember: boolean; onJoin: () => void; onOpen: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[cardStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={onOpen} activeOpacity={0.85}>
      <View style={cardStyles.groupRow}>
        {group.avatarUrl ? (
          <Image source={{ uri: group.avatarUrl }} style={cardStyles.groupAvatar} />
        ) : (
          <LinearGradient colors={["#7c3aed", "#4f46e5"]} style={[cardStyles.groupAvatar, cardStyles.groupAvatarFallback]}>
            <Text style={cardStyles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.title, { color: colors.textPrimary }]}>{group.name}</Text>
          {group.description ? <Text style={[cardStyles.sub, { color: colors.textSecondary }]} numberOfLines={2}>{group.description}</Text> : null}
          <View style={cardStyles.memberRow}>
            <Users size={11} color={colors.textMuted} />
            <Text style={[cardStyles.memberCount, { color: colors.textMuted }]}>{group.memberCount ?? 0} thành viên</Text>
          </View>
        </View>
      </View>
      <View style={cardStyles.groupActions}>
        {!isMember ? (
          <TouchableOpacity style={cardStyles.joinBtn} onPress={(e) => { e.stopPropagation?.(); onJoin(); }}>
            <LinearGradient colors={["#2563eb", "#7c3aed"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cardStyles.joinGradient}>
              <UserPlus size={13} color="white" />
              <Text style={cardStyles.joinText}>Tham gia</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={cardStyles.memberBadge}>
            <CheckCircle size={12} color="#4ade80" />
            <Text style={cardStyles.memberBadgeText}>Đã tham gia</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ── STYLES ── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingTop: sw(52),
    paddingBottom: Spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: sf(22), fontWeight: "800" },
  headerBtns: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: {
    width: sw(38), height: sw(38),
    borderRadius: Radius.md,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1,
  },
  bellBadge: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#f87171", borderRadius: 8,
    minWidth: 16, paddingHorizontal: 3, paddingVertical: 1,
    alignItems: "center",
  },
  bellBadgeText: { color: "white", fontSize: sf(9), fontWeight: "bold" },

  // Friends activity widget
  friendsWidget: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md,
  },
  friendsWidgetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  friendsWidgetTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  friendsWidgetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  friendsWidgetTitle: { fontSize: sf(14), fontWeight: "700" },
  friendsWidgetSeeAll: { fontSize: sf(12), color: "#60a5fa", fontWeight: "600" },
  friendsPostRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1 },
  friendsAvatar: { width: sw(36), height: sw(36), borderRadius: sw(18) },
  friendsPostName: { fontSize: sf(12), fontWeight: "700", marginBottom: 2 },
  friendsPostContent: { fontSize: sf(12), lineHeight: 16 },
  friendsThumb: { width: sw(44), height: sw(44), borderRadius: Radius.md },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: sw(11), fontSize: sf(14) },

  storiesRow: { marginBottom: sw(4), paddingVertical: Spacing.md },
  storiesContent: { paddingHorizontal: Spacing.md },

  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: sw(4),
    borderWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: sw(9), borderRadius: Radius.md,
  },
  tabActive: { backgroundColor: "rgba(96,165,250,0.12)" },
  tabText: { fontSize: sf(13), fontWeight: "500" },
  tabTextActive: { color: "#60a5fa", fontWeight: "700" },

  composer: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  composerRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "flex-start" },
  composerAvatar: { width: sw(40), height: sw(40), borderRadius: sw(20) },
  composerInput: {
    flex: 1,
    fontSize: sf(14),
    lineHeight: 20,
    paddingTop: 2,
    minHeight: sw(40),
    maxHeight: sw(120),
  },
  composerMediaRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: "wrap" },
  composerThumb: { width: sw(72), height: sw(72), borderRadius: Radius.md, overflow: "hidden" },
  composerThumbImg: { width: "100%", height: "100%" },
  composerThumbX: {
    position: "absolute", top: sw(2), right: sw(2),
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 99, padding: sw(2),
  },
  composerActions: {
    flexDirection: "row", alignItems: "center",
    marginTop: Spacing.sm, borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)", paddingTop: Spacing.sm,
  },
  composerActionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  composerActionText: { color: "#2563eb", fontSize: sf(13), fontWeight: "600" },
  charCount: { flex: 1, fontSize: sf(12), textAlign: "right", marginRight: Spacing.sm },
  postBtn: {
    backgroundColor: "#2563eb", borderRadius: Radius.lg,
    paddingVertical: sw(7), paddingHorizontal: sw(18),
  },
  postBtnDisabled: { backgroundColor: "rgba(0,0,0,0.08)" },
  postBtnText: { color: "white", fontWeight: "700", fontSize: sf(14) },

  listPad: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  createGroupBtn: { borderRadius: Radius.lg, overflow: "hidden", marginBottom: Spacing.sm },
  createGroupGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, paddingVertical: sw(13),
  },
  createGroupText: { color: "white", fontWeight: "700", fontSize: sf(15) },

  emptyState: { alignItems: "center", paddingTop: sw(40), gap: sw(10) },
  emptyText: { textAlign: "center", fontSize: sf(14), marginHorizontal: Spacing.lg },
  footer: { paddingVertical: sw(20), alignItems: "center" },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  eventHeader: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.sm },
  datePill: {
    width: sw(52), height: sw(52), borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  dateDay: { color: "white", fontSize: sf(18), fontWeight: "800", lineHeight: sw(20) },
  dateMonth: { color: "rgba(255,255,255,0.75)", fontSize: sf(10), fontWeight: "600" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  typeText: { color: "#60a5fa", fontSize: sf(11), fontWeight: "700" },
  title: { fontWeight: "700", fontSize: sf(15), marginBottom: 2 },
  sub: { fontSize: sf(13), marginBottom: 4 },
  link: { color: "#60a5fa", fontSize: sf(12), marginBottom: Spacing.sm },
  joinBtn: { borderRadius: Radius.lg, overflow: "hidden", marginTop: Spacing.sm, alignSelf: "flex-start" },
  joinGradient: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: sw(9), paddingHorizontal: Spacing.base,
  },
  joinText: { color: "white", fontWeight: "700", fontSize: sf(13) },
  groupRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.sm },
  groupAvatar: { width: sw(52), height: sw(52), borderRadius: Radius.lg },
  groupAvatarFallback: { justifyContent: "center", alignItems: "center" },
  groupAvatarText: { color: "white", fontWeight: "800", fontSize: sf(22) },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: sw(4) },
  memberCount: { fontSize: sf(12) },
  groupActions: { flexDirection: "row", justifyContent: "flex-end" },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(74,222,128,0.1)", borderRadius: Radius.md,
    paddingVertical: sw(6), paddingHorizontal: sw(10),
    borderWidth: 1, borderColor: "rgba(74,222,128,0.2)",
  },
  memberBadgeText: { color: "#4ade80", fontSize: sf(12), fontWeight: "600" },
});
