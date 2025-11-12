// components/AIChatbot.jsx
import GeminiService from "@/services/gemini-service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AIChatbot({ visible, onClose, userContext = {} }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const initTimeoutRef = useRef(null);

  // 監聽鍵盤事件
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        console.log("🎹 鍵盤高度:", keyboardHeight);
        // 鍵盤出現時滾動到底部
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        console.log("🎹 鍵盤隱藏");
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // 初始化聊天
  useEffect(() => {
    if (visible) {
      console.log("🤖 AIChatbot 打開");

      // 清除之前的超時
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      // 設置超時保護 - 如果初始化超過 8 秒，強制完成
      initTimeoutRef.current = setTimeout(() => {
        if (isInitializing) {
          console.warn("⚠️ 初始化超時，強制完成");
          setIsInitializing(false);
          setIsLoading(false);
        }
      }, 8000);

      initializeChat();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      console.log("🤖 AIChatbot 關閉");

      // 清除超時
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [visible]);

  const initializeChat = async () => {
    console.log("🚀 初始化聊天，消息數量:", messages.length);

    if (isInitializing) {
      console.log("⏭️ 已在初始化中，跳過");
      return;
    }

    setIsInitializing(true);

    // 如果是第一次打開聊天（沒有消息記錄），自動發送歡迎消息
    if (messages.length === 0) {
      setIsLoading(true);

      try {
        // 使用 Gemini 生成個性化歡迎消息
        const welcomePrompt = userContext.isNewUser
          ? "你好！我是新用戶，第一次使用這個 APP。"
          : "你好！";

        console.log("📤 發送歡迎消息");

        // 直接等待 Gemini 回應（不再做硬性 API 超時）
        const aiReply = await GeminiService.sendMessage(
          welcomePrompt,
          userContext
        );

        console.log("✅ 收到 AI 回應");

        const welcomeMessage = {
          id: "welcome-" + Date.now(),
          role: "ai",
          content: aiReply,
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);
      } catch (error) {
        console.error("❌ 生成歡迎消息失敗:", error.message);
        // 使用預設歡迎消息
        const defaultWelcome = {
          id: "welcome-default",
          role: "ai",
          content: userContext.isNewUser
            ? `你好 ${
                userContext.userName || ""
              }！👋\n\n我是 Soul 小手，你的手語學習好夥伴！😊\n\n我會引導你學習手語詞彙和課程、進行練習測驗，也能協助你即時翻譯手語。想了解 APP 的任何功能，或在學習上有困難，都儘管問我喔！`
            : `你好 ${
                userContext.userName || ""
              }！👋\n\n我是 Soul 小手，你的手語學習好夥伴！😊\n\n我會引導你學習手語詞彙和課程、進行練習測驗，也能協助你即時翻譯手語。想了解 APP 的任何功能，或在學習上有困難，都儘管問我喔！`,
          timestamp: new Date(),
        };
        setMessages([defaultWelcome]);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
        console.log("🏁 初始化完成");
      }
    } else {
      setIsInitializing(false);
    }

    // 載入快速回覆選項
    const replies = GeminiService.getQuickReplies(userContext.isNewUser);
    setQuickReplies(replies);
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    console.log("📤 發送用戶消息:", text.trim());

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // 滾動到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 發送到 Gemini AI（不再做硬性 API 超時）
      const aiReply = await GeminiService.sendMessage(text.trim(), userContext);

      console.log("✅ 收到 AI 回應:", aiReply.substring(0, 50) + "...");

      // 解析是否包含跳轉指令
      const { text: cleanText, navigation } =
        GeminiService.parseNavigation(aiReply);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: cleanText,
        timestamp: new Date(),
        navigation: navigation,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);

      // 滾動到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("❌ 發送消息失敗:", error.message);
      setIsLoading(false);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: error.message.includes("超時")
          ? "抱歉，回應時間過長 ⏱️ 請稍後再試！"
          : "抱歉，我現在遇到了一些問題 😅 請稍後再試！",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const handleNavigation = (path) => {
    onClose();
    setTimeout(() => {
      router.push(`/(tabs)/${path}`);
    }, 300);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="hand-right" size={16} color="#6366F1" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.content}
          </Text>

          {/* 如果有跳轉按鈕 */}
          {item.navigation && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => handleNavigation(item.navigation)}
            >
              <Ionicons name="arrow-forward-circle" size={16} color="#6366F1" />
              <Text style={styles.navigationText}>前往</Text>
            </TouchableOpacity>
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderQuickReply = ({ item }) => (
    <TouchableOpacity
      style={styles.quickReplyButton}
      onPress={() => handleQuickReply(item.text)}
    >
      <Ionicons name={item.icon} size={16} color="#6366F1" />
      <Text style={styles.quickReplyText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <View style={styles.chatContainer}>
          {/* 頂部欄 */}
          <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <Ionicons name="hand-right" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Soul 小手</Text>
                <Text style={styles.headerSubtitle}>AI 學習助手</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={styles.keyboardAvoidingContent}
            keyboardVerticalOffset={0}
          >
            {/* 消息列表 */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.messagesList,
                { paddingBottom: Math.max(120, keyboardHeight / 2) },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* 載入指示器 */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.loadingText}>思考中...</Text>
              </View>
            )}

            {/* 快速回覆 */}
            {quickReplies.length > 0 && messages.length <= 1 && (
              <View style={styles.quickRepliesContainer}>
                <Text style={styles.quickRepliesTitle}>快速開始：</Text>
                <FlatList
                  horizontal
                  data={quickReplies}
                  renderItem={renderQuickReply}
                  keyExtractor={(item) => item.id.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickRepliesList}
                />
              </View>
            )}

            {/* 輸入欄 */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="輸入訊息..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage()}
                onFocus={() => {
                  // 當輸入框獲得焦點時，確保滾動到底部
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "#fff" : "#D1D5DB"}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatContainer: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "92%", // 固定高度
    overflow: "hidden",
  },
  keyboardAvoidingContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  messagesList: {
    padding: 20,
    // paddingBottom 動態設置在組件中
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  aiText: {
    color: "#1F2937",
  },
  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  navigationText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 13,
  },
  quickRepliesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  quickRepliesTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "600",
  },
  quickRepliesList: {
    gap: 8,
  },
  quickReplyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickReplyText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24, // 大幅增加底部空間
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
    gap: 12,
    minHeight: 88, // 增加最小高度
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44, // 確保最小高度
    color: "#1F2937",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
});
