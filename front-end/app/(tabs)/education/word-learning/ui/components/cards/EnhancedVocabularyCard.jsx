// @ts-nocheck
// This is a component file, not a route
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BorderRadius,
  ColorUtils,
  Elevation,
  MaterialYouTheme,
  Spacing,
  Typography,
} from "../../themes/MaterialYouTheme";
// import LearningProgressIndicator from './LearningProgressIndicator'; // 暫時註解掉

const { width: screenWidth } = Dimensions.get("window");

const EnhancedVocabularyCard = React.memo(
  ({
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
    video_url,
    videoUrl,
    learningStatus,
    onProgressChange,
    example, // 新增例句支援
  }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showExample, setShowExample] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [videoError, setVideoError] = useState(false);

    const videoRef = useRef(null);
    const scaleValue = new Animated.Value(1);

    const handlePressIn = () => {
      setIsPressed(true);
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    };

    const handlePressOut = () => {
      setIsPressed(false);
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    };

    const getLevelColor = (level) => {
      return ColorUtils.getLevelColor(level);
    };

    const getLevelBackgroundColor = (level) => {
      switch (level) {
        case "beginner":
          return MaterialYouTheme.tertiary.tertiary95;
        case "intermediate":
          return MaterialYouTheme.secondary.secondary95;
        case "advanced":
          return MaterialYouTheme.primary.primary95;
        case "expert":
          return MaterialYouTheme.error.error95;
        default:
          return MaterialYouTheme.neutralVariant.neutralVariant95;
      }
    };

    const getLevelText = (level) => {
      switch (level) {
        case "beginner":
          return "初級";
        case "intermediate":
          return "中級";
        case "advanced":
          return "高級";
        default:
          return level || "未分級";
      }
    };

    // 影片相關函數
    const handleVideoPress = async () => {
      const finalVideoUrl = video_url || videoUrl;

      if (!finalVideoUrl) {
        Alert.alert("提示", "此詞彙暫無影片資源");
        return;
      }

      try {
        if (showVideo && videoRef.current) {
          // 如果影片已顯示，控制播放/暫停
          if (isVideoPlaying) {
            await videoRef.current.pauseAsync();
            setIsVideoPlaying(false);
          } else {
            await videoRef.current.playAsync();
            setIsVideoPlaying(true);
          }
        } else {
          // 首次點擊，顯示影片
          setShowVideo(true);
          setVideoError(false);
        }
      } catch (error) {
        console.warn("影片播放錯誤:", error);
        Alert.alert("錯誤", "影片播放失敗，請稍後再試");
        setVideoError(true);
      }
    };

    const handleVideoLoad = () => {
      setVideoError(false);
    };

    const handleVideoError = (error) => {
      console.warn("影片加載錯誤:", error);
      setVideoError(true);
      Alert.alert("錯誤", "影片載入失敗");
    };

    const handleVideoPlaybackStatusUpdate = (status) => {
      if (status.isLoaded) {
        setIsVideoPlaying(status.isPlaying);

        // 如果影片播放完畢，重置狀態
        if (status.didJustFinish) {
          setIsVideoPlaying(false);
        }
      }
    };

    const getCategoryIcon = (category) => {
      const iconMap = {
        food: "restaurant",
        animals: "paw",
        colors: "color-palette",
        numbers: "calculator",
        family: "people",
        daily: "home",
        business: "briefcase",
        education: "school",
        technology: "laptop",
        health: "medical",
        nature: "leaf",
        sports: "fitness",
        travel: "airplane",
        music: "musical-notes",
        art: "brush",
      };
      return iconMap[category] || "bookmark";
    };

    const finalImageUrl = image_url || imageUrl;

    return (
      <Animated.View
        style={[
          styles.container,
          style,
          { transform: [{ scale: scaleValue }] },
        ]}
      >
        <Pressable
          style={[
            styles.card,
            isPressed && styles.cardPressed,
            {
              backgroundColor: getLevelBackgroundColor(level),
              borderLeftColor: getLevelColor(level),
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{
            color: MaterialYouTheme.primary.primary80,
            borderless: false,
            radius: 200,
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
              <Text style={styles.categoryText}>{category || "未分類"}</Text>
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

              <Text
                style={styles.definition}
                numberOfLines={showExample ? 1 : 2}
              >
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
                    name={showExample ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={MaterialYouTheme.primary.primary40}
                  />
                  <Text style={styles.exampleToggleText}>
                    {showExample ? "收合例句" : "查看例句"}
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
              {/* 圖片/影片容器 */}
              <View style={styles.mediaContainer}>
                {showVideo && (video_url || videoUrl) ? (
                  <View style={styles.videoContainer}>
                    <Video
                      ref={videoRef}
                      source={{ uri: video_url || videoUrl }}
                      style={styles.videoPlayer}
                      useNativeControls={false}
                      shouldPlay={false}
                      isLooping={true}
                      onLoad={handleVideoLoad}
                      onError={handleVideoError}
                      onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                      resizeMode="contain"
                    />

                    {/* 影片控制覆蓋層 */}
                    <TouchableOpacity
                      style={styles.videoOverlay}
                      onPress={handleVideoPress}
                      activeOpacity={0.7}
                    >
                      {!isVideoPlaying && (
                        <View style={styles.playButton}>
                          <Ionicons name="play" size={24} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* 關閉影片按鈕 */}
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
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : finalImageUrl ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: finalImageUrl }}
                      style={[
                        styles.wordImage,
                        imageLoaded && styles.imageLoaded,
                      ]}
                      resizeMode="cover"
                      onLoad={() => setImageLoaded(true)}
                      onError={(error) =>
                        console.warn("圖片加載失敗:", error.nativeEvent.error)
                      }
                    />
                    {!imageLoaded && (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="image-outline"
                          size={24}
                          color={
                            MaterialYouTheme.neutralVariant.neutralVariant50
                          }
                        />
                      </View>
                    )}

                    {/* 影片播放按鈕覆蓋在圖片上 */}
                    {(video_url || videoUrl) && (
                      <TouchableOpacity
                        style={styles.videoPlayButton}
                        onPress={handleVideoPress}
                        activeOpacity={0.8}
                      >
                        <View style={styles.playButtonBackground}>
                          <Ionicons name="play" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={MaterialYouTheme.neutralVariant.neutralVariant50}
                    />
                    {(video_url || videoUrl) && (
                      <TouchableOpacity
                        style={styles.videoPlayButtonAlt}
                        onPress={handleVideoPress}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="play-circle"
                          size={32}
                          color={MaterialYouTheme.primary.primary50}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={onToggleFavorite}
                style={[
                  styles.favoriteButton,
                  isFavorite && styles.favoriteButtonActive,
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={
                    isFavorite
                      ? MaterialYouTheme.error.error40
                      : MaterialYouTheme.neutralVariant.neutralVariant50
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 底部快速操作 */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
              <Ionicons
                name="volume-high-outline"
                size={18}
                color={MaterialYouTheme.primary.primary40}
              />
              <Text style={styles.quickActionText}>發音</Text>
            </TouchableOpacity>

            {(video_url || videoUrl) && (
              <TouchableOpacity
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={handleVideoPress}
              >
                <Ionicons
                  name={
                    showVideo
                      ? isVideoPlaying
                        ? "pause"
                        : "play"
                      : "videocam-outline"
                  }
                  size={18}
                  color={MaterialYouTheme.tertiary.tertiary40}
                />
                <Text style={styles.quickActionText}>
                  {showVideo ? (isVideoPlaying ? "暫停" : "播放") : "影片"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
              <Ionicons
                name="create-outline"
                size={18}
                color={MaterialYouTheme.secondary.secondary40}
              />
              <Text style={styles.quickActionText}>練習</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
              <Ionicons
                name="share-outline"
                size={18}
                color={MaterialYouTheme.secondary.secondary40}
              />
              <Text style={styles.quickActionText}>分享</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

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
    overflow: "hidden",
  },
  cardPressed: {
    ...Elevation.level1,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categorySection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryText: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.neutralVariant.neutralVariant30,
    marginLeft: Spacing.xs,
    textTransform: "capitalize",
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
    fontWeight: "600",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textSection: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  word: {
    ...Typography.headlineSmall,
    color: MaterialYouTheme.onSurface.onSurface,
    fontWeight: "700",
    flex: 1,
  },
  progressIndicator: {
    marginLeft: Spacing.sm,
  },
  pronunciation: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.primary.primary40,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  definition: {
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  exampleToggle: {
    flexDirection: "row",
    alignItems: "center",
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
    fontStyle: "italic",
  },
  rightSection: {
    alignItems: "center",
    minWidth: 80,
  },
  mediaContainer: {
    width: 72,
    height: 72,
    marginBottom: Spacing.md,
    position: "relative",
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
    position: "relative",
  },
  videoContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
    position: "relative",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeVideoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayButtonAlt: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  wordImage: {
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  imageLoaded: {
    opacity: 1,
  },
  imagePlaceholder: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MaterialYouTheme.surface.surface,
    ...Elevation.level1,
  },
  favoriteButtonActive: {
    backgroundColor: MaterialYouTheme.errorContainer.errorContainer,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: MaterialYouTheme.outline.outline,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
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
