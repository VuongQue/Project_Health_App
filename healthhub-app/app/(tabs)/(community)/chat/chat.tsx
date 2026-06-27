import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowLeft, Send, Smile } from "lucide-react-native";

interface ChatScreenProps {
  friend: { name: string; username: string; avatar: string };
  onBack: () => void;
  socket: any; // socket.io connection
  userId: string;
  roomId: string;
}

export default function ChatScreen({ friend, onBack, socket, userId, roomId }: ChatScreenProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    socket.emit("joinRoom", { roomId, userId });

    socket.on("message", (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    const messageData = {
      roomId,
      senderId: userId,
      text: input,
      createdAt: new Date().toISOString(),
    };

    socket.emit("sendMessage", messageData);

    setMessages((prev) => [...prev, messageData]);
    setInput("");

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* HEADER */}
      <View className="flex-row items-center px-4 py-3 bg-[#1e293b] border-b border-[#334155]">
        <Pressable onPress={onBack} className="p-2">
          <ArrowLeft size={28} color="white" />
        </Pressable>

        <View className="ml-3 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 items-center justify-center">
            <Text className="text-xl">{friend.avatar}</Text>
          </View>

          <View className="ml-3">
            <Text className="text-white text-base font-semibold">{friend.name}</Text>
            <Text className="text-green-400 text-xs">● Đang hoạt động</Text>
          </View>
        </View>
      </View>

      {/* CHAT LIST */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-3"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => {
          const isMe = msg.senderId === userId;

          return (
            <View
              key={index}
              className={`my-2 flex-row ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <View className="w-8 h-8 rounded-full bg-[#1e293b] mr-2 items-center justify-center">
                  <Text>{friend.avatar}</Text>
                </View>
              )}

              <View
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMe ? "bg-blue-600 rounded-br-none" : "bg-[#1e293b] rounded-bl-none"
                }`}
              >
                <Text className="text-white">{msg.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-center px-4 py-3 bg-[#0f172a] border-t border-[#1e293b]">
          <Pressable className="p-2 mr-2">
            <Smile size={26} color="#94a3b8" />
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhắn tin..."
            placeholderTextColor="#64748b"
            className="flex-1 bg-[#1e293b] text-white px-4 py-3 rounded-2xl border border-[#334155]"
          />

          <Pressable
            onPress={sendMessage}
            className="p-2 ml-2 bg-blue-600 rounded-full w-10 h-10 items-center justify-center"
          >
            <Send size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
