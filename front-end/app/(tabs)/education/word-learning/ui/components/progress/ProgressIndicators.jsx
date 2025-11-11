// @ts-nocheck
// This is a component file, not a route
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, ColorUtils } from '../MaterialYouTheme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * 學習進度環形指示器
 */
export const CircularProgressIndicator = ({ 
  progress = 0, // 0-100
  size = 60,
  strokeWidth = 6,
  showText = true,
  animated = true,
  style,
  children
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.circularProgress, { width: size, height: size }, style]}>
      <Animated.View style={styles.progressContainer}>
        {/* 背景圓圈 */}
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: MaterialYouTheme.neutralVariant.neutralVariant90,
            }
          ]}
        />
        
        {/* 進度圓圈 */}
        <Animated.View
          style={[
            styles.progressCircle,
            styles.progressFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: "#2563EB", // 藍色主題
              transform: [{ rotate: '-90deg' }],
            }
          ]}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]} // 藍色漸層
            style={[
              styles.gradientCircle,
              {
                width: size - strokeWidth,
                height: size - strokeWidth,
                borderRadius: (size - strokeWidth) / 2,
              }
            ]}
          />
        </Animated.View>
      </Animated.View>

      {/* 中心內容 */}
      <View style={styles.centerContent}>
        {children || (showText && (
          <Text style={styles.progressText}>
            {Math.round(progress)}%
          </Text>
        ))}
      </View>
    </View>
  );
};

/**
 * 學習進度條
 */
export const LearningProgressBar = ({ 
  progress = 0, // 0-100
  height = 8,
  showLabel = true,
  label = '',
  animated = true,
  style
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  const progressWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.progressBarContainer, style]}>
      {showLabel && (
        <View style={styles.progressLabelContainer}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
      )}
      
      <View style={[styles.progressBarTrack, { height }]}>
        <Animated.View style={[styles.progressBarFill, { height, width: progressWidth }]}>
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]} // 藍色漸層
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * 學習狀態指示器
 */
export const LearningStatusIndicator = ({ 
  status = 'new', // new, learning, reviewing, mastered, difficult
  size = 'medium', // small, medium, large
  onPress,
  style,
  showLabel = true
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusConfig = () => {
    const configs = {
      new: {
        icon: 'add-circle-outline',
        color: MaterialYouTheme.neutralVariant.neutralVariant40,
        backgroundColor: MaterialYouTheme.neutralVariant.neutralVariant95,
        label: '新詞'
      },
      learning: {
        icon: 'school-outline',
        color: MaterialYouTheme.tertiary.tertiary40,
        backgroundColor: MaterialYouTheme.tertiary.tertiary95,
        label: '學習中'
      },
      reviewing: {
        icon: 'refresh-outline',
        color: MaterialYouTheme.secondary.secondary40,
        backgroundColor: MaterialYouTheme.secondary.secondary95,
        label: '復習'
      },
      mastered: {
        icon: 'checkmark-circle',
        color: MaterialYouTheme.primary.primary40,
        backgroundColor: MaterialYouTheme.primary.primary95,
        label: '已掌握'
      },
      difficult: {
        icon: 'warning-outline',
        color: MaterialYouTheme.error.error40,
        backgroundColor: MaterialYouTheme.error.error95,
        label: '困難'
      }
    };
    return configs[status] || configs.new;
  };

  const getSizeConfig = () => {
    const configs = {
      small: { iconSize: 16, containerSize: 32 },
      medium: { iconSize: 20, containerSize: 40 },
      large: { iconSize: 24, containerSize: 48 }
    };
    return configs[size];
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <Component
        style={[
          styles.statusIndicator,
          {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
            backgroundColor: statusConfig.backgroundColor,
          }
        ]}
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Ionicons 
          name={statusConfig.icon} 
          size={sizeConfig.iconSize} 
          color={statusConfig.color}
        />
        {showLabel && size === 'large' && (
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        )}
      </Component>
    </Animated.View>
  );
};

/**
 * 多步驟進度指示器
 */
export const StepProgressIndicator = ({ 
  steps = [],
  currentStep = 0,
  style
}) => {
  const stepWidth = (screenWidth - Spacing.xl * 2) / Math.max(steps.length, 1);

  return (
    <View style={[styles.stepProgressContainer, style]}>
      <View style={styles.stepTrack}>
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <View key={index} style={styles.stepContainer}>
              {/* 連接線 */}
              {index > 0 && (
                <View 
                  style={[
                    styles.stepConnector,
                    { backgroundColor: isActive 
                      ? MaterialYouTheme.primary.primary40 
                      : MaterialYouTheme.neutralVariant.neutralVariant90 
                    }
                  ]} 
                />
              )}
              
              {/* 步驟圓點 */}
              <View 
                style={[
                  styles.stepDot,
                  isCurrent && styles.stepDotCurrent,
                  { backgroundColor: isActive 
                    ? MaterialYouTheme.primary.primary40 
                    : MaterialYouTheme.neutralVariant.neutralVariant90 
                  }
                ]}
              >
                {isActive ? (
                  <Ionicons 
                    name="checkmark" 
                    size={12} 
                    color={MaterialYouTheme.primary.primary100}
                  />
                ) : (
                  <View style={styles.stepDotInner} />
                )}
              </View>

              {/* 步驟標籤 */}
              <Text 
                style={[
                  styles.stepLabel,
                  { color: isActive 
                    ? MaterialYouTheme.primary.primary40 
                    : MaterialYouTheme.neutralVariant.neutralVariant50 
                  }
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 圓形進度條樣式
  circularProgress: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  progressFill: {
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  gradientCircle: {
    position: 'absolute',
    top: -3,
    left: -3,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    ...Typography.labelLarge,
    color: MaterialYouTheme.primary.primary40,
    fontWeight: '600',
  },

  // 進度條樣式
  progressBarContainer: {
    width: '100%',
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.onSurface.onSurface,
  },
  progressPercentage: {
    ...Typography.labelMedium,
    color: MaterialYouTheme.primary.primary40,
    fontWeight: '600',
  },
  progressBarTrack: {
    backgroundColor: MaterialYouTheme.neutralVariant.neutralVariant90,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },

  // 狀態指示器樣式
  statusIndicator: {
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  statusLabel: {
    ...Typography.labelSmall,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // 步驟進度器樣式
  stepProgressContainer: {
    paddingVertical: Spacing.lg,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepConnector: {
    position: 'absolute',
    left: -50,
    width: 100,
    height: 2,
    top: 8,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepDotCurrent: {
    transform: [{ scale: 1.2 }],
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  stepLabel: {
    ...Typography.labelSmall,
    textAlign: 'center',
  },
});

export default {
  CircularProgressIndicator,
  LearningProgressBar,
  LearningStatusIndicator,
  StepProgressIndicator,
};
