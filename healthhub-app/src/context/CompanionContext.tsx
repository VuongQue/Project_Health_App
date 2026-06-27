import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '@/src/api/axiosClient';
import { getToken, onTokenChange } from '@/src/utils/tokenStorage';

export interface CompanionMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: number;
}

interface CompanionContextValue {
  enabled: boolean;
  toggleEnabled: () => void;
  ttsEnabled: boolean;
  toggleTts: () => void;
  messages: CompanionMessage[];
  loading: boolean;
  dailyGreeting: { greeting: string; tip: string; suggestions: string[] } | null;
  isNewUser: boolean;
  isAuthenticated: boolean;
  sendMessage: (text: string, screen?: string) => Promise<void>;
  clearHistory: () => void;
  fetchDailyGreeting: () => Promise<void>;
}

export const CompanionContext = createContext<CompanionContextValue>({
  enabled: false,
  toggleEnabled: () => {},
  ttsEnabled: true,
  toggleTts: () => {},
  messages: [],
  loading: false,
  dailyGreeting: null,
  isNewUser: false,
  isAuthenticated: false,
  sendMessage: async () => {},
  clearHistory: () => {},
  fetchDailyGreeting: async () => {},
});

const STORAGE_KEY = '@companion_enabled';
const TTS_KEY = '@companion_tts';
const MESSAGES_KEY = '@companion_messages';
const GREETING_KEY = '@companion_greeting_date';
const ONBOARDED_KEY = '@companion_onboarded';

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyGreeting, setDailyGreeting] = useState<{ greeting: string; tip: string; suggestions: string[] } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    (async () => {
      const [storedEnabled, storedTts, storedMessages, storedOnboarded] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TTS_KEY),
        AsyncStorage.getItem(MESSAGES_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);

      // User mới (chưa từng có companion setting) → tự động bật Hana
      if (storedEnabled === null && storedOnboarded === null) {
        setEnabled(true);
        setIsNewUser(true);
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      } else {
        if (storedEnabled !== null) setEnabled(storedEnabled === 'true');
      }

      if (storedTts !== null) setTtsEnabled(storedTts !== 'false');
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          setMessages(parsed.slice(-20));
        } catch {}
      }
      initialized.current = true;
    })();
  }, []);

  // Track authentication state via token
  useEffect(() => {
    getToken().then((t) => setIsAuthenticated(!!t));
    const unsub = onTokenChange((hasToken) => setIsAuthenticated(hasToken));
    return unsub;
  }, []);

  const toggleEnabled = useCallback(async () => {
    setEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleTts = useCallback(async () => {
    setTtsEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem(TTS_KEY, String(next));
      return next;
    });
  }, []);

  const fetchDailyGreeting = useCallback(async () => {
    const token = await getToken();
    if (!token) return; // Chưa đăng nhập — không fetch

    try {
      const today = new Date().toDateString();
      const lastDate = await AsyncStorage.getItem(GREETING_KEY);
      if (lastDate === today && dailyGreeting) return;

      const res = await axiosClient.get('/ai/companion/daily');
      setDailyGreeting(res.data);
      await AsyncStorage.setItem(GREETING_KEY, today);
    } catch {
      setDailyGreeting({
        greeting: 'Chào bạn! Hana đây 👋 Hôm nay bạn cảm thấy thế nào?',
        tip: 'Uống một ly nước ngay bây giờ nhé!',
        suggestions: ['Ghi lại mood hôm nay', 'Cập nhật bước chân', 'Xem bài tập'],
      });
    }
  }, [dailyGreeting]);

  const sendMessage = useCallback(async (text: string, screen?: string) => {
    const userMsg: CompanionMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axiosClient.post('/ai/companion/chat', {
        message: text,
        history: history.slice(0, -1), // không gửi tin nhắn cuối (đã là message)
        screen,
      });

      const assistantMsg: CompanionMessage = {
        role: 'assistant',
        content: res.data.reply,
        suggestions: res.data.suggestions ?? [],
        timestamp: Date.now(),
      };

      const updated = [...newMessages, assistantMsg];
      setMessages(updated);
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated.slice(-20)));
    } catch {
      const errMsg: CompanionMessage = {
        role: 'assistant',
        content: 'Xin lỗi, Hana đang gặp sự cố. Thử lại nhé! 🙏',
        timestamp: Date.now(),
      };
      const updated = [...newMessages, errMsg];
      setMessages(updated);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    await AsyncStorage.removeItem(MESSAGES_KEY);
  }, []);

  return (
    <CompanionContext.Provider value={{
      enabled,
      toggleEnabled,
      ttsEnabled,
      toggleTts,
      messages,
      loading,
      dailyGreeting,
      isNewUser,
      isAuthenticated,
      sendMessage,
      clearHistory,
      fetchDailyGreeting,
    }}>
      {children}
    </CompanionContext.Provider>
  );
}

export const useCompanion = () => useContext(CompanionContext);
