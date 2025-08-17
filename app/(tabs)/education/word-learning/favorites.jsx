import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from './MaterialYouTheme';
import MaterialTopAppBar from './components/MaterialTopAppBar';
import VocabularyCard from './components/VocabularyCard';
import WordDetailModal from './components/WordDetailModal';
import { getFavorites, toggleFavorite } from '@/utils/favorites';

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
      // 模擬收藏的單詞數據
      const mockFavorites = [
        {
          id: 'fav1',
          word: '早安',
          pronunciation: 'zǎo ān',
          definition: '用於早上問候的禮貌用語',
          category: '其他',
          level: 'beginner',
          image_url: 'https://res.cloudinary.com/dbmrnpwxd/image/upload/v1753859928/%E6%97%A9%E5%AE%89_jnoxps.png',
          example: '早安！今天天氣真好。'
        },
        {
          id: 'fav2',
          word: '臉',
          pronunciation: 'liǎn',
          definition: '人體頭部的前面部分',
          category: '身體健康',
          level: 'intermediate',
          image_url: 'https://res.cloudinary.com/dbmrnpwxd/image/upload/v1753962770/%E8%87%89_c1ltth.png',
          example: '她有一張美麗的臉。'
        },
        {
          id: 'fav3',
          word: '頭髮',
          pronunciation: 'tóu fǎ',
          definition: '人頭上的毛髮',
          category: '身體健康',
          level: 'advanced',
          image_url: 'https://res.cloudinary.com/dbmrnpwxd/image/upload/v1754038756/%E9%A0%AD%E9%AB%AE_gho46g.png',
          example: '她的頭髮很長很漂亮。'
        }
      ];
      setFavorites(mockFavorites);
    } catch (error) {
      console.error('載入收藏失敗:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWordPress = (word) => {
    setSelectedWord(word);
    setShowWordDetail(true);
  };

  const handleToggleFavorite = async (word) => {
    try {
      const wordId = word.id || word._id;
      const newFavorites = favorites.filter(fav => (fav.id || fav._id) !== wordId);
      setFavorites(newFavorites);
      await toggleFavorite(wordId);
    } catch (error) {
      console.error('移除收藏失敗:', error);
      Alert.alert('錯誤', '無法移除收藏，請稍後再試');
    }
  };

  const renderWordCard = ({ item }) => (
    <VocabularyCard
      word={item.word}
      pronunciation={item.pronunciation}
      definition={item.definition}
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
      <Ionicons name="heart-outline" size={64} color={MaterialYouTheme.neutral.neutral60} />
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={MaterialYouTheme.neutral.neutral99} barStyle="dark-content" />
        
        <MaterialTopAppBar
          title="我的收藏"
          subtitle={`${favorites.length} 個收藏的單詞`}
          onBackPress={() => router.back()}
        />

        <FlatList
          data={favorites}
          renderItem={renderWordCard}
          keyExtractor={(item) => (item.id || item._id || Math.random()).toString()}
          contentContainerStyle={[
            styles.listContainer,
            favorites.length === 0 && styles.emptyContainer
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />

        <WordDetailModal
          visible={showWordDetail}
          word={selectedWord}
          onClose={() => setShowWordDetail(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MaterialYouTheme.neutral.neutral99,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.neutral.neutral30,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateMessage: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral50,
    textAlign: 'center',
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
    fontWeight: '600',
  },
});

export default FavoritesScreen;
