import GeminiService from "@/services/gemini-service";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// --- 關鍵修正 ---
// 這是 AI 助手 Header 的靜態高度
// 來自 styles.header: paddingTop(24) + avatar(40) + paddingBottom(16) = 80
const HEADER_HEIGHT = 80;

export default function AIChatbot({ visible, onClose, userContext = {} }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [typingText, setTypingText] = useState("");
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const initTimeoutRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      console.log("🤖 AIChatbot 打開");
      initializeChat();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      console.log("🤖 AIChatbot 關閉");
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

    if (messages.length === 0) {
      setIsLoading(true);
      try {
        const welcomePrompt = userContext.isNewUser
          ? "你好！我是新用戶，第一次使用這個 APP。"
          : "你好！";
        console.log("📤 發送歡迎消息");
        const aiReply = await GeminiService.sendMessage(
          welcomePrompt,
          userContext
        );
        console.log("✅ 收到 AI 回應");

        // 解析特殊標記
        const {
          text: cleanText,
          navigation,
          featureCards,
          statsCard,
        } = GeminiService.parseNavigation(aiReply);

        const welcomeMessage = {
          id: "welcome-" + Date.now(),
          role: "ai",
          content: cleanText,
          timestamp: new Date(),
          navigation: navigation,
          featureCards: featureCards,
          statsCard: statsCard,
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error("❌ 生成歡迎消息失敗:", error.message);
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
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // --- 新增：自動偵測推薦問題 ---
    const recommendKeywords = [
      "推薦",
      "課程",
      "影片",
      "教材",
      "學什麼",
      "有什麼適合",
      "有什麼建議",
    ];
    const isRecommend = recommendKeywords.some((kw) => text.includes(kw));
    try {
      if (isRecommend && userContext?.userId) {
        // 1. 先查詢推薦API
        const res = await fetch(
          `/api/recommendations/personalized/${userContext.userId}`
        );
        const data = await res.json();
        const recs = data.recommendations || [];
        // 2. 組裝推薦內容給AI
        const recText = recs
          .map((r) => `【${r.title}】${r.description}`)
          .join("\n");
        const prompt = `用戶想要推薦課程/影片/教材。以下是根據用戶學習狀態推薦的內容：\n${recText}\n請根據這些推薦，友善地向用戶說明每個推薦的重點，並鼓勵用戶點擊卡片開始學習。`;
        const aiReply = await GeminiService.sendMessage(prompt, userContext);
        const { text: cleanText } = GeminiService.parseNavigation(aiReply);
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: cleanText,
          timestamp: new Date(),
          featureCards: recs,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return;
      }
      // --- 一般對話 ---
      const aiReply = await GeminiService.sendMessage(text.trim(), userContext);
      console.log("✅ 收到 AI 回應:", aiReply.substring(0, 50) + "...");
      const {
        text: cleanText,
        navigation,
        featureCards,
        statsCard,
      } = GeminiService.parseNavigation(aiReply);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: cleanText,
        timestamp: new Date(),
        navigation: navigation,
        featureCards: featureCards,
        statsCard: statsCard,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
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

          {/* 功能卡片 */}
          {item.featureCards && (
            <View style={styles.featureCardsContainer}>
              {item.featureCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCard}
                  onPress={() => handleNavigation(card.path)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.featureCardIcon,
                      { backgroundColor: card.color + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={card.icon}
                      size={24}
                      color={card.color}
                    />
                  </View>
                  <View style={styles.featureCardContent}>
                    <Text style={styles.featureCardTitle}>{card.title}</Text>
                    <Text style={styles.featureCardDesc}>
                      {card.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 學習統計卡片 */}
          {item.statsCard && (
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Ionicons name="stats-chart" size={18} color="#6366F1" />
                <Text style={styles.statsTitle}>你的學習概況</Text>
              </View>
              <View style={styles.statsGrid}>
                {item.statsCard.map((stat, index) => (
                  <View key={index} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 導航按鈕 */}
          {item.navigation && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => handleNavigation(item.navigation)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward-circle" size={20} color="#4F46E5" />
              <Text style={styles.navigationText}>立即前往</Text>
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
                <Text style={styles.headerSubtitle}>
                  {isLoading ? "正在思考..." : "AI 學習助手 • 隨時為你服務"}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {/* 建議開關 */}
              <TouchableOpacity
                onPress={() => setShowSuggestions(!showSuggestions)}
                style={styles.headerButton}
              >
                <Ionicons
                  name={showSuggestions ? "bulb" : "bulb-outline"}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          {/* --- 關鍵修正 --- */}
          <KeyboardAvoidingView // 1. iOS 和 Android 統一使用 "padding"
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={styles.keyboardAvoidingContent} // 2. 添加 Header 的高度作為 offset
            keyboardVerticalOffset={HEADER_HEIGHT}
          >
            {/* 消息列表 */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
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
            {/* 智能建議 */}
            {showSuggestions && messages.length > 2 && !isLoading && (
              <View style={styles.suggestionsBar}>
                <Ionicons name="bulb" size={16} color="#F59E0B" />
                <Text style={styles.suggestionText}>
                  試試問我：「推薦適合我的課程」「查看學習統計」
                </Text>
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
            <View
              style={[
                styles.inputContainer, // 這裡動態加上 "安全區域" 的 padding // 確保 Android 導覽列 / iOS Home 條不會遮擋
                { paddingBottom: (insets.bottom || 0) + 20 },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="輸入訊息..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage()}
                onFocus={() => {
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
    paddingHorizontal: 20, // 總高度 = 24 (paddingTop) + 40 (avatar) + 16 (paddingBottom) = 80
    paddingVertical: 16, // 設置 paddingBottom: 16
    paddingTop: 24, // 覆蓋為 paddingTop: 24
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
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  closeButton: {
    padding: 4,
  },
  messagesList: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 100,
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
    fontSize: 17,
    lineHeight: 24,
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
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  navigationText: {
    color: "#4F46E5",
    fontSize: 16,
    fontWeight: "700",
  },
  // 功能卡片樣式
  featureCardsContainer: {
    marginTop: 12,
    gap: 8,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureCardContent: {
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  featureCardDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
  // 學習統計卡片
  statsCard: {
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  // 智能建議欄
  suggestionsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
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
    fontSize: 15,
  },
  quickRepliesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  quickRepliesTitle: {
    fontSize: 15,
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
    fontSize: 16,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 20, // 這裡的 padding: 20 會設定 T/R/L (Bottom 會被動態覆蓋)
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
    gap: 12,
    minHeight: 88,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    maxHeight: 100,
    minHeight: 48,
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
