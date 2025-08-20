import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation, ColorUtils } from '../MaterialYouTheme';
import LearningProgressIndicator from './LearningProgressIndicator';

const VocabularyCard = React.memo(({ 
  word, 
  pronunciation, 
  definition, 
  category, 
  level, 
  isFavorite, 
  onToggleFavorite, 
  onPress,
  style,
  image_url,
  imageUrl, // 支援多種命名格式
  learningStatus, // 新增學習狀態
  onProgressChange // 新增學習狀態變更回調
}) => {
  const getLevelColor = (level) => {
    return ColorUtils.getLevelColor(level);
  };

  const getLevelBackgroundColor = (level) => {
    switch (level) {
      case 'beginner':
        return MaterialYouTheme.secondary.secondary90;
      case 'intermediate':
        return MaterialYouTheme.tertiary.tertiary90;
      case 'advanced':
        return MaterialYouTheme.primary.primary90;
      case 'expert':
        return MaterialYouTheme.error.error90;
      default:
        return MaterialYouTheme.neutral.neutral90;
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'beginner':
        return '初學';
      case 'intermediate':
        return '進階';
      case 'advanced':
        return '熟練';
      default:
        return level;
    }
  };

  const finalImageUrl = image_url || imageUrl;

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.wordSection}>
          <Text style={styles.word}>{word}</Text>
          {pronunciation && (
            <Text style={styles.pronunciation}>/{pronunciation}/</Text>
          )}
        </View>
        <View style={styles.rightSection}>
          {learningStatus && onProgressChange && (
            <LearningProgressIndicator
              status={learningStatus}
              onPress={onProgressChange}
              size="small"
              style={styles.progressIndicator}
            />
          )}
          <TouchableOpacity 
            onPress={onToggleFavorite}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {finalImageUrl && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: finalImageUrl }} 
            style={styles.wordImage}
            resizeMode="contain"
            onError={(error) => console.warn('圖片加載失敗:', error.nativeEvent.error)}
          />
        </View>
      )}

      <Text style={styles.definition} numberOfLines={2}>
        {definition}
      </Text>

      <View style={styles.footer}>
        <View style={styles.tags}>
          {category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
          {level && (
            <View style={[
              styles.levelTag, 
              { backgroundColor: getLevelBackgroundColor(level) }
            ]}>
              <Text style={[
                styles.levelText, 
                { color: getLevelColor(level) }
              ]}>
                {getLevelText(level)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: MaterialYouTheme.neutral.neutral99,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    ...Elevation.level1,
    borderWidth: 1,
    borderColor: MaterialYouTheme.neutralVariant.neutralVariant90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  wordSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressIndicator: {
    marginRight: 4,
  },
  word: {
    ...Typography.titleLarge,
    color: MaterialYouTheme.primary.primary30,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  pronunciation: {
    ...Typography.bodySmall,
    color: MaterialYouTheme.neutral.neutral50,
    fontStyle: 'italic',
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: '100%',
    height: 120,
  },
  wordImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    backgroundColor: MaterialYouTheme.neutral.neutral95,
  },
  definition: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral30,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryTag: {
    backgroundColor: MaterialYouTheme.secondary.secondary90,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  categoryText: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.secondary.secondary30,
    fontWeight: '500',
  },
  levelTag: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  levelText: {
    ...Typography.labelSmall,
    fontWeight: '500',
  },
});

export default VocabularyCard;
