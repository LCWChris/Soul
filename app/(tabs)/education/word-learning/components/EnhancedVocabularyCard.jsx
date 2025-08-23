// @ts-nocheck
// This is a component file, not a route
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Animated, 
  Pressable,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation, ColorUtils } from '../MaterialYouTheme';
// import LearningProgressIndicator from './LearningProgressIndicator'; // 暫時註解掉

const { width: screenWidth } = Dimensions.get('window');

const EnhancedVocabularyCard = React.memo(({ 
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
  imageUrl,
  learningStatus,
  onProgressChange,
  example // 新增例句支援
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
  };

  const getLevelColor = (level) => {
    return ColorUtils.getLevelColor(level);
  };

  const getLevelBackgroundColor = (level) => {
    switch (level) {
      case 'beginner':
        return MaterialYouTheme.tertiary.tertiary95;
      case 'intermediate':
        return MaterialYouTheme.secondary.secondary95;
      case 'advanced':
        return MaterialYouTheme.primary.primary95;
      case 'expert':
        return MaterialYouTheme.error.error95;
      default:
        return MaterialYouTheme.neutralVariant.neutralVariant95;
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'beginner':
        return '初級';
      case 'intermediate':
        return '中級';
      case 'advanced':
        return '高級';
      default:
        return level || '未分級';
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'food': 'restaurant',
      'animals': 'paw',
      'colors': 'color-palette',
      'numbers': 'calculator',
      'family': 'people',
      'daily': 'home',
      'business': 'briefcase',
      'education': 'school',
      'technology': 'laptop',
      'health': 'medical',
      'nature': 'leaf',
      'sports': 'fitness',
      'travel': 'airplane',
      'music': 'musical-notes',
      'art': 'brush'
    };
    return iconMap[category] || 'bookmark';
  };

  const finalImageUrl = image_url || imageUrl;

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale: scaleValue }] }]}>
      <Pressable 
        style={[
          styles.card, 
          isPressed && styles.cardPressed,
          {
            backgroundColor: getLevelBackgroundColor(level),
            borderLeftColor: getLevelColor(level),
          }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: MaterialYouTheme.primary.primary80,
          borderless: false,
          radius: 200
        }}
      >
        {/* 頂部狀態列 */}
        <View style={styles.statusBar}>
          <View style={styles.categorySection}>
            <Ionicons 
              name={getCategoryIcon(category)} 
              size={16} 
              color={MaterialYouTheme.neutralVariant.neutralVariant30} 
            />
            <Text style={styles.categoryText}>{category || '未分類'}</Text>
          </View>
          
          <View style={styles.levelBadge}>
            <Text style={[styles.levelText, { color: getLevelColor(level) }]}>
              {getLevelText(level)}
            </Text>
          </View>
        </View>

        {/* 主要內容區域 */}
        <View style={styles.mainContent}>
          {/* 左側文字區域 */}
          <View style={styles.textSection}>
            <View style={styles.wordHeader}>
              <Text style={styles.word}>{word}</Text>
              {/* 暫時註解掉 LearningProgressIndicator
              {learningStatus && onProgressChange && (
                <LearningProgressIndicator
                  status={learningStatus}
                  onPress={onProgressChange}
                  size="small"
                  style={styles.progressIndicator}
                />
              )}
              */}
            </View>
            
            {pronunciation && (
              <Text style={styles.pronunciation}>/{pronunciation}/</Text>
            )}
            
            <Text style={styles.definition} numberOfLines={showExample ? 1 : 2}>
              {definition}
            </Text>

            {/* 例句展開/收合 */}
            {example && (
              <TouchableOpacity 
                style={styles.exampleToggle}
                onPress={() => setShowExample(!showExample)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showExample ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={MaterialYouTheme.primary.primary40} 
                />
                <Text style={styles.exampleToggleText}>
                  {showExample ? '收合例句' : '查看例句'}
                </Text>
              </TouchableOpacity>
            )}

            {showExample && example && (
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            )}
          </View>

          {/* 右側圖片和操作區域 */}
          <View style={styles.rightSection}>
            {finalImageUrl && (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: finalImageUrl }} 
                  style={[
                    styles.wordImage,
                    imageLoaded && styles.imageLoaded
                  ]}
                  resizeMode="cover"
                  onLoad={() => setImageLoaded(true)}
                  onError={(error) => console.warn('圖片加載失敗:', error.nativeEvent.error)}
                />
                {!imageLoaded && (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons 
                      name="image-outline" 
                      size={24} 
                      color={MaterialYouTheme.neutralVariant.neutralVariant50} 
                    />
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              onPress={onToggleFavorite}
              style={[
                styles.favoriteButton,
                isFavorite && styles.favoriteButtonActive
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={20} 
                color={isFavorite ? MaterialYouTheme.error.error40 : MaterialYouTheme.neutralVariant.neutralVariant50} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部快速操作 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="volume-high-outline" size={18} color={MaterialYouTheme.primary.primary40} />
            <Text style={styles.quickActionText}>發音</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={MaterialYouTheme.secondary.secondary40} />
            <Text style={styles.quickActionText}>練習</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={MaterialYouTheme.tertiary.tertiary40} />
            <Text style={styles.quickActionText}>分享</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Elevation.level2,
    overflow: 'hidden',
  },
  cardPressed: {
    ...Elevation.level1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.neutralVariant.neutralVariant30,
    marginLeft: Spacing.xs,
    textTransform: 'capitalize',
  },
  levelBadge: {
    backgroundColor: MaterialYouTheme.surface.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    ...Elevation.level1,
  },
  levelText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textSection: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  word: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.onSurface.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  progressIndicator: {
    marginLeft: Spacing.sm,
  },
  pronunciation: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.primary.primary40,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  definition: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  exampleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exampleToggleText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.primary.primary40,
    marginLeft: Spacing.xs,
  },
  exampleContainer: {
    backgroundColor: MaterialYouTheme.primaryContainer.primaryContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  exampleText: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.onPrimaryContainer.onPrimaryContainer,
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'center',
    minWidth: 80,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
  },
  wordImage: {
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  imageLoaded: {
    opacity: 1,
  },
  imagePlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.surface.surface,
    ...Elevation.level1,
  },
  favoriteButtonActive: {
    backgroundColor: MaterialYouTheme.errorContainer.errorContainer,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: MaterialYouTheme.outline.outline,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: MaterialYouTheme.surface.surface,
    ...Elevation.level1,
  },
  quickActionText: {
    ...Typography.labelMedium,
    marginLeft: Spacing.xs,
    color: MaterialYouTheme.onSurface.onSurface,
  },
});

export default EnhancedVocabularyCard;
