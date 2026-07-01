import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Linking, Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { ExternalLink } from "lucide-react-native";
import { useColors, Radius, Spacing, sf, sw } from "@/src/theme";
import { Advertisement } from "@/src/api/adsApi";
import adsApi from "@/src/api/adsApi";

interface AdCardProps {
  ad: Advertisement;
  /** compact = banner nhỏ trong feed, full = card lớn trong personal */
  variant?: "compact" | "full";
  onDismiss?: () => void;
}

export default function AdCard({ ad, variant = "compact", onDismiss }: AdCardProps) {
  const colors = useColors();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      adsApi.trackImpression(ad.id).catch(() => {});
    }
  }, [ad.id]);

  const handlePress = async () => {
    adsApi.trackClick(ad.id).catch(() => {});
    if (ad.targetUrl) {
      try {
        const canOpen = await Linking.canOpenURL(ad.targetUrl);
        if (canOpen) Linking.openURL(ad.targetUrl);
      } catch {}
    }
  };

  if (variant === "compact") {
    return (
      <View style={[styles.compactWrapper, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.sponsoredBadge}>
          <Text style={[styles.sponsoredText, { color: colors.textMuted }]}>Được tài trợ</Text>
        </View>
        <TouchableOpacity style={styles.compactInner} onPress={handlePress} activeOpacity={0.85}>
          {ad.mediaType === "image" ? (
            <Image source={{ uri: ad.mediaUrl }} style={styles.compactImage} resizeMode="cover" />
          ) : (
            <View style={[styles.compactVideoPlaceholder, { backgroundColor: colors.bgSecondary }]}>
              <Text style={{ color: colors.textMuted, fontSize: sf(11) }}>🎬 Video</Text>
            </View>
          )}
          <View style={styles.compactContent}>
            <Text style={[styles.compactBrand, { color: colors.primary }]} numberOfLines={1}>
              {ad.brandName}
            </Text>
            <Text style={[styles.compactTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {ad.title}
            </Text>
            {ad.description ? (
              <Text style={[styles.compactDesc, { color: colors.textMuted }]} numberOfLines={1}>
                {ad.description}
              </Text>
            ) : null}
            <View style={[styles.ctaChip, { backgroundColor: colors.primaryBg, borderColor: colors.primary + "44" }]}>
              <ExternalLink size={11} color={colors.primary} />
              <Text style={[styles.ctaText, { color: colors.primary }]}>{ad.ctaText}</Text>
            </View>
          </View>
        </TouchableOpacity>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // variant === "full"
  return (
    <View style={[styles.fullWrapper, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={styles.sponsoredBadge}>
        <Text style={[styles.sponsoredText, { color: colors.textMuted }]}>Được tài trợ</Text>
      </View>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.88}>
        {ad.mediaType === "image" ? (
          <Image source={{ uri: ad.mediaUrl }} style={styles.fullImage} resizeMode="cover" />
        ) : (
          <Video
            source={{ uri: ad.mediaUrl }}
            style={styles.fullVideo}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
        )}
        <View style={styles.fullContent}>
          <Text style={[styles.fullBrand, { color: colors.primary }]}>{ad.brandName}</Text>
          <Text style={[styles.fullTitle, { color: colors.textPrimary }]}>{ad.title}</Text>
          {ad.description ? (
            <Text style={[styles.fullDesc, { color: colors.textSecondary }]}>{ad.description}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.fullCtaBtn, { backgroundColor: colors.primary }]}
            onPress={handlePress}
          >
            <ExternalLink size={14} color="#fff" />
            <Text style={styles.fullCtaBtnText}>{ad.ctaText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.dismissText, { color: colors.textMuted }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const SCREEN_W = Dimensions.get("window").width;

const styles = StyleSheet.create({
  // compact
  compactWrapper: {
    flexDirection: "row", borderRadius: Radius.xl, borderWidth: 1,
    overflow: "hidden", marginVertical: sw(6),
  },
  compactInner: { flex: 1, flexDirection: "row", padding: Spacing.sm, gap: sw(10) },
  compactImage: { width: sw(72), height: sw(72), borderRadius: Radius.lg },
  compactVideoPlaceholder: { width: sw(72), height: sw(72), borderRadius: Radius.lg, alignItems: "center", justifyContent: "center" },
  compactContent: { flex: 1, gap: sw(3), justifyContent: "center" },
  compactBrand: { fontSize: sf(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  compactTitle: { fontSize: sf(13), fontWeight: "700", lineHeight: 18 },
  compactDesc: { fontSize: sf(11) },
  ctaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", paddingHorizontal: sw(8), paddingVertical: sw(3),
    borderRadius: Radius.full, borderWidth: 1, marginTop: sw(2),
  },
  ctaText: { fontSize: sf(11), fontWeight: "700" },

  // full
  fullWrapper: { borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden", marginVertical: sw(8) },
  fullImage: { width: "100%", height: sw(180) },
  fullVideo: { width: "100%", height: sw(180) },
  fullContent: { padding: Spacing.base, gap: sw(6) },
  fullBrand: { fontSize: sf(11), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  fullTitle: { fontSize: sf(16), fontWeight: "800" },
  fullDesc: { fontSize: sf(13), lineHeight: 20 },
  fullCtaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: sw(11), borderRadius: Radius.lg, marginTop: sw(4),
  },
  fullCtaBtnText: { color: "#fff", fontWeight: "800", fontSize: sf(14) },

  // shared
  sponsoredBadge: { position: "absolute", top: sw(6), left: sw(8), zIndex: 1 },
  sponsoredText: { fontSize: sf(9), letterSpacing: 0.3 },
  dismissBtn: { position: "absolute", top: sw(6), right: sw(8), zIndex: 2, padding: sw(2) },
  dismissText: { fontSize: sf(13), fontWeight: "700" },
});
