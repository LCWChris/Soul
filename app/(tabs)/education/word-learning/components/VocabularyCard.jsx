import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
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
  video_url,
  videoUrl, // 支援多種命名格式
  learningStatus, // 新增學習狀態
  onProgressChange // 新增學習狀態變更回調
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  const videoRef = useRef(null);
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

  // 影片相關函數
  const handleVideoPress = async () => {
    const finalVideoUrl = video_url || videoUrl;
    
    if (!finalVideoUrl) {
      Alert.alert('提示', '此詞彙暫無影片資源');
      return;
    }

    try {
      if (showVideo && videoRef.current) {
        if (isVideoPlaying) {
          await videoRef.current.pauseAsync();
          setIsVideoPlaying(false);
        } else {
          await videoRef.current.playAsync();
          setIsVideoPlaying(true);
        }
      } else {
        setShowVideo(true);
        setVideoError(false);
      }
    } catch (error) {
      console.warn('影片播放錯誤:', error);
      Alert.alert('錯誤', '影片播放失敗，請稍後再試');
      setVideoError(true);
    }
  };

  const handleVideoPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsVideoPlaying(false);
      }
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

      {/* 媒體容器 - 圖片或影片 */}
      {(finalImageUrl || (video_url || videoUrl)) && (
        <View style={styles.mediaContainer}>
          {showVideo && (video_url || videoUrl) ? (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: video_url || videoUrl }}
                style={styles.videoPlayer}
                useNativeControls={false}
                shouldPlay={false}
                isLooping={false}
                onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                resizeMode="contain"
              />
              
              <TouchableOpacity 
                style={styles.videoOverlay}
                onPress={handleVideoPress}
                activeOpacity={0.7}
              >
                {!isVideoPlaying && (
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeVideoButton}
                onPress={() => {
                  setShowVideo(false);
                  setIsVideoPlaying(false);
                  if (videoRef.current) {
                    videoRef.current.pauseAsync();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ) : finalImageUrl ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: finalImageUrl }} 
                style={styles.wordImage}
                resizeMode="contain"
                onError={(error) => console.warn('圖片加載失敗:', error.nativeEvent.error)}
              />
              
              {/* 影片播放按鈕覆蓋在圖片上 */}
              {(video_url || videoUrl) && (
                <TouchableOpacity 
                  style={styles.videoPlayButton}
                  onPress={handleVideoPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.playButtonSmall}>
                    <Ionicons name="play" size={16} color="white" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <TouchableOpacity 
                style={styles.videoPlayButtonAlt}
                onPress={handleVideoPress}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="play-circle" 
                  size={40} 
                  color={MaterialYouTheme.primary.primary50} 
                />
                <Text style={styles.videoText}>播放影片</Text>
              </TouchableOpacity>
            </View>
          )}
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
        
        {/* 影片按鈕 */}
        {(video_url || videoUrl) && (
          <TouchableOpacity 
            style={styles.videoQuickButton}
            onPress={handleVideoPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showVideo ? (isVideoPlaying ? "pause-circle" : "play-circle") : "videocam"} 
              size={24} 
              color={MaterialYouTheme.primary.primary50} 
            />
          </TouchableOpacity>
        )}
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
  mediaContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: '100%',
    height: 120,
    position: 'relative',
  },
  imageContainer: {
    alignItems: 'center',
    width: '100%',
    height: 120,
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: MaterialYouTheme.neutral.neutral95,
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  playButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.neutral.neutral95,
    borderRadius: BorderRadius.md,
  },
  videoPlayButtonAlt: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    ...Typography.labelSmall,
    color: MaterialYouTheme.primary.primary50,
    marginTop: Spacing.xs,
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
  videoQuickButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: MaterialYouTheme.primary.primary95,
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
