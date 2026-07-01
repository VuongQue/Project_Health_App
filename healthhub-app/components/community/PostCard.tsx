import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Share,
  Animated,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import {
  Heart, MessageSquare, Share2, MoreHorizontal,
  Pencil, Trash2, Bookmark, Flag, X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { PostItem } from "@/src/types/community";
import { communityApi } from "@/src/api/communityApi";
import { PostComments } from "./PostComments";
import { useColors, Spacing, Radius, sf, sw } from "@/src/theme";

interface Props {
  post: PostItem;
  refresh: () => void;
  currentUserId?: string;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam / Quảng cáo" },
  { value: "HATE_SPEECH", label: "Ngôn từ thù địch" },
  { value: "VIOLENCE", label: "Bạo lực / Đe dọa" },
  { value: "HARASSMENT", label: "Quấy rối / Bắt nạt" },
  { value: "MISINFORMATION", label: "Thông tin sai lệch" },
  { value: "NSFW", label: "Nội dung nhạy cảm" },
  { value: "OTHER", label: "Khác" },
];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`;
  return d.toLocaleDateString("vi-VN");
}

export function PostCard({ post, refresh, currentUserId }: Props) {
  const router = useRouter();
  const colors = useColors();
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(
    currentUserId ? (post.likes ?? []).includes(currentUserId) : false
  );
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  const heartAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number>(0);

  const authorName = post.user?.name ?? "User";
  const avatarUrl = post.user?.avatar ?? null;
  const isOwner = currentUserId != null && post.userId === currentUserId;

  const doLike = async () => {
    if (liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    try {
      await communityApi.toggleLike(post._id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    } finally {
      setLiking(false);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) doLike();
      heartAnim.setValue(0);
      Animated.sequence([
        Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
        Animated.delay(600),
        Animated.timing(heartAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  };

  const handleDelete = () => {
    Alert.alert("Xoá bài viết", "Bạn có chắc muốn xoá bài này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            await communityApi.deletePost(post._id);
            refresh();
          } catch {
            Alert.alert("Lỗi", "Không thể xoá bài viết");
          }
        },
      },
    ]);
  };

  const handleReport = async () => {
    if (!selectedReason) return;
    setReporting(true);
    try {
      await communityApi.reportPost(post._id, selectedReason);
      setReportVisible(false);
      setSelectedReason(null);
      Alert.alert("Đã báo cáo", "Cảm ơn bạn đã giúp cộng đồng lành mạnh hơn. Chúng tôi sẽ xem xét bài viết này.");
    } catch {
      Alert.alert("Lỗi", "Không thể gửi báo cáo. Thử lại sau.");
    } finally {
      setReporting(false);
    }
  };

  const heartScale = heartAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.4, 1] });
  const heartOpacity = heartAnim;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorRow} activeOpacity={0.75}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatar, { backgroundColor: colors.bgSecondary }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{authorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.author, { color: colors.textPrimary }]}>{authorName}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(post.createdAt)} trước</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
          <MoreHorizontal size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* DROPDOWN MENU */}
      {showMenu && (
        <View style={[styles.menu, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push({
                    pathname: "/(tabs)/(community)/posts/[id]",
                    params: { id: post._id, edit: "1" },
                  } as any);
                }}
              >
                <Pencil size={16} color={colors.textMuted} />
                <Text style={[styles.menuText, { color: colors.textSecondary }]}>Chỉnh sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setShowMenu(false); handleDelete(); }}
              >
                <Trash2 size={16} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>Xoá bài viết</Text>
              </TouchableOpacity>
            </>
          )}
          {!isOwner && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); setReportVisible(true); }}
            >
              <Flag size={16} color="#f97316" />
              <Text style={[styles.menuText, { color: "#f97316" }]}>Báo cáo vi phạm</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* CONTENT */}
      {post.content ? <Text style={[styles.content, { color: colors.textSecondary }]}>{post.content}</Text> : null}

      {/* MEDIA */}
      {post.media?.length > 0 && (
        <Pressable onPress={handleDoubleTap}>
          <View style={styles.mediaWrap}>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push({ pathname: "/(tabs)/(community)/posts/[id]", params: { id: post._id } } as any)}
            >
              <View style={styles.mediaGrid}>
                {post.media.slice(0, 4).map((uri, index) => {
                  const isLast = index === 3 && post.media.length > 4;
                  return (
                    <View key={index} style={[styles.mediaItem, post.media.length === 1 && styles.mediaItemFull]}>
                      <Image source={{ uri }} style={styles.mediaImage} />
                      {isLast && (
                        <View style={styles.overlay}>
                          <Text style={styles.overlayText}>+{post.media.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
            <Animated.View
              pointerEvents="none"
              style={[styles.doubleTapHeart, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}
            >
              <Heart size={80} color={colors.danger} fill={colors.danger} />
            </Animated.View>
          </View>
        </Pressable>
      )}

      {/* STATS ROW */}
      {(likeCount > 0 || post.commentCount > 0) && (
        <View style={styles.statsRow}>
          {likeCount > 0 && (
            <View style={styles.statChip}>
              <Heart size={13} color={colors.danger} fill={colors.danger} />
              <Text style={[styles.statChipText, { color: colors.textMuted }]}>{likeCount}</Text>
            </View>
          )}
          {post.commentCount > 0 && (
            <Text style={[styles.commentStat, { color: colors.textMuted }]}>{post.commentCount} bình luận</Text>
          )}
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, liked && { backgroundColor: "rgba(239,68,68,0.08)" }]}
          onPress={doLike}
          activeOpacity={0.7}
        >
          <Heart size={18} color={liked ? colors.danger : colors.textMuted} fill={liked ? colors.danger : "none"} />
          <Text style={[styles.actionText, { color: liked ? colors.danger : colors.textMuted }]}>Thích</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(!showComments)} activeOpacity={0.7}>
          <MessageSquare size={18} color={showComments ? colors.primary : colors.textMuted} />
          <Text style={[styles.actionText, { color: showComments ? colors.primary : colors.textMuted }]}>Bình luận</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Share.share({ message: post.content ?? "", title: `Post by ${authorName}` })}
          activeOpacity={0.7}
        >
          <Share2 size={18} color={colors.textMuted} />
          <Text style={[styles.actionText, { color: colors.textMuted }]}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setSaved((s) => !s)} activeOpacity={0.7}>
          <Bookmark size={18} color={saved ? colors.warning : colors.textMuted} fill={saved ? colors.warning : "none"} />
        </TouchableOpacity>
      </View>

      {showComments && <PostComments postId={post._id} currentUserId={currentUserId} />}

      {/* REPORT MODAL */}
      <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Báo cáo bài viết</Text>
              <TouchableOpacity onPress={() => { setReportVisible(false); setSelectedReason(null); }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Chọn lý do vi phạm để giúp chúng tôi duy trì cộng đồng lành mạnh.
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.reasonItem,
                    { borderColor: colors.border },
                    selectedReason === r.value && styles.reasonSelected,
                  ]}
                  onPress={() => setSelectedReason(r.value)}
                >
                  <View style={[styles.reasonRadio, selectedReason === r.value && styles.reasonRadioActive]} />
                  <Text style={[styles.reasonText, { color: colors.textSecondary }, selectedReason === r.value && { color: "#60a5fa" }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.reportBtn, !selectedReason && styles.reportBtnDisabled]}
              onPress={handleReport}
              disabled={!selectedReason || reporting}
            >
              <Flag size={16} color="white" />
              <Text style={styles.reportBtnText}>{reporting ? "Đang gửi..." : "Gửi báo cáo"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 0, marginBottom: 8, borderTopWidth: 1, borderBottomWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#3b82f6" },
  avatarInitial: { color: "white", fontWeight: "bold", fontSize: 17 },
  author: { fontWeight: "700", fontSize: 15 },
  time: { fontSize: 12, marginTop: 1 },
  menuBtn: { padding: 6 },
  menu: { marginHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  menuText: { fontSize: 14 },
  content: { paddingHorizontal: 14, paddingBottom: 10, lineHeight: 22, fontSize: 15 },
  mediaWrap: { position: "relative" },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap" },
  mediaItem: { width: "50%", aspectRatio: 1, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.1)" },
  mediaItemFull: { width: "100%", aspectRatio: 4 / 3 },
  mediaImage: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  overlayText: { color: "white", fontSize: 28, fontWeight: "bold" },
  doubleTapHeart: { position: "absolute", top: "50%", left: "50%", marginLeft: -40, marginTop: -40 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  statChipText: { fontSize: 13 },
  commentStat: { fontSize: 13 },
  divider: { height: 1, marginHorizontal: 0 },
  actions: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontSize: 13, fontWeight: "600" },

  // Report modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: Spacing.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  modalTitle: { fontSize: sf(18), fontWeight: "800" },
  modalSub: { fontSize: sf(13), marginBottom: Spacing.md, lineHeight: 18 },
  reasonItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: Spacing.sm, borderBottomWidth: 1 },
  reasonSelected: { backgroundColor: "rgba(96,165,250,0.08)" },
  reasonRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#64748b" },
  reasonRadioActive: { borderColor: "#60a5fa", backgroundColor: "#60a5fa" },
  reasonText: { fontSize: sf(14) },
  reportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f97316", borderRadius: Radius.xl, paddingVertical: sw(14), marginTop: Spacing.md },
  reportBtnDisabled: { backgroundColor: "#374151" },
  reportBtnText: { color: "white", fontWeight: "800", fontSize: sf(15) },
});
