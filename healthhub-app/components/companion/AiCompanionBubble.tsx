import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Mic, MicOff, Send, Trash2, X } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { useCompanion } from '@/src/context/CompanionContext';
import { useColors, Colors, Radius, sf, sw } from '@/src/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// Routes where companion should be hidden
const HIDDEN_ROUTES = ['/story/', '/login', '/otp', '/register', '/forgot-password', '/reset-password', '/(auth)'];

function shouldHide(pathname: string) {
  return HIDDEN_ROUTES.some((r) => pathname.includes(r));
}

function getScreenKey(pathname: string): string {
  if (pathname.includes('/fitness')) return 'fitness';
  if (pathname.includes('/mood')) return 'mood';
  if (pathname.includes('/water')) return 'water';
  if (pathname.includes('/steps')) return 'steps';
  if (pathname.includes('/food')) return 'food';
  if (pathname.includes('/profile')) return 'profile';
  if (pathname.includes('/challenge')) return 'challenges';
  if (pathname.includes('/community') || pathname.includes('/feed')) return 'community';
  return 'home';
}

export default function AiCompanionBubble() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { enabled, ttsEnabled, toggleTts, messages, loading, dailyGreeting, isNewUser, isAuthenticated, sendMessage, clearHistory, fetchDailyGreeting } = useCompanion();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;
  const flatRef = useRef<FlatList>(null);

  const speak = (text: string) => {
    if (!ttsEnabled) return;
    try {
      Speech.stop();
      Speech.speak(text, { language: 'vi-VN', pitch: 1.1, rate: 0.95 });
    } catch {}
  };

  const stopSpeech = () => {
    try { Speech.stop(); } catch {}
  };

  // Pulse animation for fab
  useEffect(() => {
    if (!enabled) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [enabled]);

  // Fetch daily greeting when enabled
  useEffect(() => {
    if (enabled && !greetingDismissed) {
      if (isNewUser) {
        // User mới: hiện ngay bubble chào mừng không cần fetch
        setShowGreeting(true);
        Animated.timing(greetingAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      } else {
        fetchDailyGreeting().then(() => {
          setShowGreeting(true);
          Animated.timing(greetingAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        });
      }
    }
  }, [enabled, isNewUser]);

  // Scroll to bottom when new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Speak last assistant message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && open) {
      speak(last.content);
    }
  }, [messages, open]);

  if (!enabled || !isAuthenticated || shouldHide(pathname)) return null;

  const screenKey = getScreenKey(pathname);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    stopSpeech();
    if (showGreeting) {
      setShowGreeting(false);
      setGreetingDismissed(true);
    }
    if (!open) setOpen(true);
    await sendMessage(text, screenKey);
  };

  const handleSuggestion = (s: string) => {
    if (showGreeting) {
      setShowGreeting(false);
      setGreetingDismissed(true);
    }
    setOpen(true);
    sendMessage(s, screenKey);
  };

  const handleOpen = () => {
    setShowGreeting(false);
    setGreetingDismissed(true);
    setOpen(true);
    if (messages.length === 0) {
      const firstMsg = isNewUser
        ? 'Xin chào Hana! Tôi vừa mới dùng app, hãy hướng dẫn tôi các tính năng chính nhé!'
        : 'Xin chào Hana! Hôm nay tôi nên làm gì?';
      sendMessage(firstMsg, screenKey);
    }
  };

  const handleClose = () => {
    setOpen(false);
    stopSpeech();
  };

  const fabBottom = insets.bottom + 90; // above tab bar

  return (
    <>
      {/* Greeting bubble (proactive popup) */}
      {showGreeting && (isNewUser || dailyGreeting) && !open && (
        <Animated.View
          style={[
            styles.greetingBubble,
            {
              bottom: fabBottom + sw(64) + 8,
              right: sw(16),
              backgroundColor: colors.bgCard,
              borderColor: Colors.gradientPrimary[0] + '40',
              opacity: greetingAnim,
              transform: [{ translateY: greetingAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.greetingClose}
            onPress={() => { setShowGreeting(false); setGreetingDismissed(true); }}
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
          {isNewUser ? (
            <>
              <Text style={[styles.greetingText, { color: colors.textPrimary }]}>
                Chào mừng đến với HealthHub! 👋 Mình là Hana, AI bạn đồng hành của bạn.
              </Text>
              <Text style={[styles.greetingTip, { color: colors.textSecondary }]}>
                🌟 Nhấn vào mình để được hướng dẫn các tính năng của app nhé!
              </Text>
              <View style={styles.greetingSuggestions}>
                {['Hướng dẫn tôi dùng app', 'Bắt đầu từ đâu?'].map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.suggChip, { backgroundColor: Colors.gradientPrimary[0] + '20', borderColor: Colors.gradientPrimary[0] + '40' }]}
                    onPress={() => handleSuggestion(s)}
                  >
                    <Text style={[styles.suggChipText, { color: Colors.gradientPrimary[0] }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.greetingText, { color: colors.textPrimary }]}>{dailyGreeting!.greeting}</Text>
              <Text style={[styles.greetingTip, { color: colors.textSecondary }]}>💡 {dailyGreeting!.tip}</Text>
              {dailyGreeting!.suggestions.length > 0 && (
                <View style={styles.greetingSuggestions}>
                  {dailyGreeting!.suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggChip, { backgroundColor: Colors.gradientPrimary[0] + '20', borderColor: Colors.gradientPrimary[0] + '40' }]}
                      onPress={() => handleSuggestion(s)}
                    >
                      <Text style={[styles.suggChipText, { color: Colors.gradientPrimary[0] }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* FAB */}
      <Animated.View
        style={[
          styles.fab,
          { bottom: fabBottom, right: sw(16), transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity onPress={handleOpen} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Text style={styles.fabEmoji}>🤖</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat modal */}
      <Modal visible={open} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View
            style={[
              styles.chatSheet,
              {
                backgroundColor: colors.bgCard,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.chatHeader}
            >
              <View style={styles.chatHeaderLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                </View>
                <View>
                  <Text style={styles.chatTitle}>Hana</Text>
                  <Text style={styles.chatSubtitle}>AI Bạn Đồng Hành · HealthHub</Text>
                </View>
              </View>
              <View style={styles.chatHeaderRight}>
                <TouchableOpacity onPress={toggleTts} style={styles.headerBtn}>
                  {ttsEnabled ? <Mic size={18} color="white" /> : <MicOff size={18} color="rgba(255,255,255,0.5)" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => clearHistory()} style={styles.headerBtn}>
                  <Trash2 size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Messages */}
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={<EmptyChat colors={colors} greeting={dailyGreeting} onSuggestion={handleSuggestion} isNewUser={isNewUser} />}
              renderItem={({ item }) => (
                <MessageBubble msg={item} colors={colors} />
              )}
              ListFooterComponent={loading ? <TypingIndicator colors={colors} /> : null}
            />

            {/* Input */}
            <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.bgPrimary }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgInput, borderColor: colors.border }]}
                value={input}
                onChangeText={setInput}
                placeholder="Hỏi Hana điều gì đó..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || loading}
                style={[styles.sendBtn, { opacity: input.trim() && !loading ? 1 : 0.4 }]}
              >
                <LinearGradient colors={Colors.gradientPrimary} style={styles.sendBtnInner}>
                  <Send size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function MessageBubble({ msg, colors }: { msg: any; colors: any }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View
          style={[
            styles.msgBubble,
            isUser
              ? { backgroundColor: Colors.gradientPrimary[0], borderBottomRightRadius: 4 }
              : { backgroundColor: colors.bgCardElevated, borderBottomLeftRadius: 4 },
          ]}
        >
          <Text style={[styles.msgText, { color: isUser ? 'white' : colors.textPrimary }]}>
            {msg.content}
          </Text>
        </View>
        {msg.suggestions && msg.suggestions.length > 0 && (
          <View style={styles.suggRow}>
            {msg.suggestions.map((s: string, i: number) => (
              <View key={i} style={[styles.suggChipSmall, { backgroundColor: Colors.gradientPrimary[0] + '15', borderColor: Colors.gradientPrimary[0] + '30' }]}>
                <Text style={[styles.suggChipSmallText, { color: Colors.gradientPrimary[0] }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: any }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]));
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={[styles.msgRow, styles.msgRowBot]}>
      <View style={styles.botAvatar}><Text style={{ fontSize: 16 }}>🤖</Text></View>
      <View style={[styles.msgBubble, { backgroundColor: colors.bgCardElevated, flexDirection: 'row', gap: 4, paddingVertical: 14 }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { backgroundColor: colors.textMuted, transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}

function EmptyChat({ colors, greeting, onSuggestion, isNewUser }: { colors: any; greeting: any; onSuggestion: (s: string) => void; isNewUser?: boolean }) {
  const newUserSuggestions = [
    'Hướng dẫn tôi dùng app',
    'Các tính năng chính là gì?',
    'Tôi bắt đầu từ đâu?',
  ];
  const suggestions = isNewUser
    ? newUserSuggestions
    : (greeting?.suggestions ?? ['Hôm nay tôi nên làm gì?', 'Hướng dẫn tôi dùng app', 'Gợi ý bài tập hôm nay']);

  return (
    <View style={styles.emptyChat}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>🤖</Text>
      <Text style={[styles.emptyChatTitle, { color: colors.textPrimary }]}>
        {isNewUser ? 'Chào mừng! Mình là Hana 👋' : 'Xin chào! Mình là Hana'}
      </Text>
      <Text style={[styles.emptyChatSub, { color: colors.textSecondary }]}>
        {isNewUser
          ? 'Mình sẽ hướng dẫn bạn khám phá HealthHub và đồng hành cùng hành trình sức khoẻ của bạn!'
          : 'Bạn đồng hành sức khoẻ của bạn. Hỏi mình bất cứ điều gì về sức khoẻ, hoặc thử các gợi ý:'}
      </Text>
      <View style={styles.emptySuggestions}>
        {suggestions.map((s: string, i: number) => (
          <TouchableOpacity
            key={i}
            style={[styles.emptySuggChip, { backgroundColor: Colors.gradientPrimary[0] + '18', borderColor: Colors.gradientPrimary[0] + '35' }]}
            onPress={() => onSuggestion(s)}
          >
            <Text style={[styles.emptySuggText, { color: Colors.gradientPrimary[0] }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // FAB
  fab: { position: 'absolute', zIndex: 999 },
  fabInner: {
    width: sw(54), height: sw(54), borderRadius: sw(27),
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gradientPrimary[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 10,
  },
  fabEmoji: { fontSize: 24 },

  // Greeting bubble
  greetingBubble: {
    position: 'absolute', right: sw(16), zIndex: 998,
    width: SW * 0.78, borderRadius: Radius.xl, borderWidth: 1,
    padding: 14, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },
  greetingClose: { position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 1 },
  greetingText: { fontSize: sf(14), fontWeight: '600', lineHeight: 20, paddingRight: 20 },
  greetingTip: { fontSize: sf(12), lineHeight: 18 },
  greetingSuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  suggChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  suggChipText: { fontSize: sf(11), fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  chatSheet: {
    height: SH * 0.72,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
  },

  // Header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatTitle: { color: 'white', fontWeight: '700', fontSize: sf(15) },
  chatSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: sf(11) },
  chatHeaderRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8, borderRadius: 20 },

  // Messages
  messageList: { padding: 16, gap: 12, flexGrow: 1 },
  msgRow: { flexDirection: 'row', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gradientPrimary[0] + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  msgBubble: {
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  msgText: { fontSize: sf(14), lineHeight: 20 },
  suggRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5, marginLeft: 40 },
  suggChipSmall: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  suggChipSmallText: { fontSize: sf(11) },

  // Typing dots
  typingDot: { width: 6, height: 6, borderRadius: 3 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: sf(14), maxHeight: 100,
  },
  sendBtn: { marginBottom: 2 },
  sendBtnInner: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyChat: { alignItems: 'center', padding: 24, paddingTop: 32 },
  emptyChatTitle: { fontSize: sf(17), fontWeight: '700', marginBottom: 8 },
  emptyChatSub: { fontSize: sf(13), textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptySuggestions: { width: '100%', gap: 8 },
  emptySuggChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center',
  },
  emptySuggText: { fontSize: sf(13), fontWeight: '600' },
});
