import { API_CONFIG } from "@/constants/api";
import { getFavorites, toggleFavorite } from "@/utils/favorites";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VocabularyCard from "./ui/components/cards/VocabularyCard";
import MaterialTopAppBar from "./ui/components/material/MaterialTopAppBar";
import WordDetailModal from "./ui/components/modals/WordDetailModal";
import {
  BorderRadius,
  Elevation,
  MaterialYouTheme,
  Spacing,
  Typography,
} from "./ui/themes/MaterialYouTheme";

const FavoritesScreen = () => {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showWordDetail, setShowWordDetail] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      console.log("❤️ 收藏頁面：開始載入收藏列表...");
      const favoriteIds = await getFavorites();
      console.log("❤️ 收藏頁面：獲取到的收藏 IDs:", favoriteIds);

      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      // 嘗試從 API 獲取真實的單詞資料
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOK_WORDS}?limit=1000`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 檢查 Content-Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("伺服器返回非 JSON 格式");
        }

        const data = await response.json();
        // API 直接返回陣列，確保數據格式正確
        let allWords = data;
        if (!Array.isArray(allWords)) {
          allWords = allWords.words || allWords.data || [];
        }

        // 根據收藏的 ID 過濾出對應的單詞
        const favoriteWords = allWords.filter((word) =>
          favoriteIds.includes(word._id || word.id)
        );

        console.log("❤️ 收藏頁面：從 API 獲取的收藏單詞:", favoriteWords);
        setFavorites(favoriteWords);
      } catch (apiError) {
        console.log("❤️ API 獲取失敗，使用模擬數據:", apiError.message);

        // API 失敗時使用模擬數據，但用真實的收藏ID
        const mockFavoriteWords = favoriteIds.map((id, index) => ({
          _id: id,
          id: id,
          word: `收藏單詞${index + 1}`,
          title: `收藏單詞${index + 1}`,
          content: `收藏單詞${index + 1}`,
          pronunciation: "shōu cáng",
          definition: `這是你收藏的第${index + 1}個單詞`,
          category: "收藏",
          level: "beginner",
          image_url:
            "https://res.cloudinary.com/dbmrnpwxd/image/upload/v1753859928/%E6%97%A9%E5%AE%89_jnoxps.png",
          example: `這是你收藏的第${index + 1}個單詞的例句。`,
        }));

        console.log("❤️ 收藏頁面：使用模擬的收藏單詞:", mockFavoriteWords);
        setFavorites(mockFavoriteWords);
      }
    } catch (error) {
      console.error("載入收藏失敗:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [router]);

  const handleWordPress = (word) => {
    setSelectedWord(word);
    setShowWordDetail(true);
  };

  const handleToggleFavorite = async (word) => {
    try {
      const wordId = word.id || word._id;
      const newFavorites = favorites.filter(
        (fav) => (fav.id || fav._id) !== wordId
      );
      setFavorites(newFavorites);
      await toggleFavorite(wordId);
    } catch (error) {
      console.error("移除收藏失敗:", error);
      Alert.alert("錯誤", "無法移除收藏，請稍後再試");
    }
  };

  const renderWordCard = ({ item }) => (
    <VocabularyCard
      word={item.word || item.title || item.content}
      pronunciation={item.pronunciation}
      definition={item.definition || item.content}
      category={item.category}
      level={item.level}
      image_url={item.image_url}
      isFavorite={true}
      onToggleFavorite={() => handleToggleFavorite(item)}
      onPress={() => handleWordPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="heart-outline"
        size={64}
        color={MaterialYouTheme.neutral.neutral60}
      />
      <Text style={styles.emptyStateTitle}>還沒有收藏的單詞</Text>
      <Text style={styles.emptyStateMessage}>
        在學習過程中點擊心形圖標來收藏你喜歡的單詞
      </Text>
      <TouchableOpacity
        style={styles.goBackButton}
        onPress={() => router.back()}
      >
        <Text style={styles.goBackText}>開始學習</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={["#F1F5FF", "#E8EEFF"]} style={styles.container}>
      <StatusBar backgroundColor="#F1F5FF" barStyle="dark-content" />

      <MaterialTopAppBar
        title="我的收藏"
        subtitle={`${favorites.length} 個收藏的單詞`}
        onBackPress={() => router.back()}
      />

      <FlatList
        data={favorites}
        renderItem={renderWordCard}
        keyExtractor={(item) =>
          (item.id || item._id || Math.random()).toString()
        }
        contentContainerStyle={[
          styles.listContainer,
          favorites.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <WordDetailModal
        visible={showWordDetail}
        word={selectedWord}
        onClose={() => setShowWordDetail(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 0, // TopAppBar 現在已經包含安全間距，所以這裡不需要額外間距
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral30,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyStateMessage: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral50,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  goBackButton: {
    backgroundColor: MaterialYouTheme.primary.primary50,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Elevation.level2,
  },
  goBackText: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.primary.primary99,
    fontWeight: "600",
  },
});

export default FavoritesScreen;
