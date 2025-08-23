// @ts-nocheck
// This is a component file, not a route
import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated, 
  View,
  ActivityIndicator,
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';

/**
 * Material You 3.0 風格按鈕組件
 * 支援多種樣式：filled, outlined, text, tonal
 */
const MaterialButton = ({ 
  title,
  variant = 'filled', // filled, outlined, text, tonal
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left', // left, right
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  fullWidth = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.96,
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

  const getButtonStyles = () => {
    const baseStyle = {
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // 尺寸配置
    const sizeConfig = {
      small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        minHeight: 36,
      },
      medium: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        minHeight: 40,
      },
      large: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
        minHeight: 48,
      }
    };

    // 變體樣式
    const variantStyles = {
      filled: {
        backgroundColor: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant90
          : MaterialYouTheme.primary.primary40,
        ...Elevation.level1,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant50
          : MaterialYouTheme.primary.primary40,
      },
      text: {
        backgroundColor: 'transparent',
      },
      tonal: {
        backgroundColor: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant90
          : MaterialYouTheme.primary.primary90,
      }
    };

    return {
      ...baseStyle,
      ...sizeConfig[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyles = () => {
    const baseTextStyle = size === 'large' 
      ? Typography.titleMedium 
      : Typography.labelLarge;

    const variantTextStyles = {
      filled: {
        color: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant30
          : MaterialYouTheme.primary.primary100,
      },
      outlined: {
        color: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant30
          : MaterialYouTheme.primary.primary40,
      },
      text: {
        color: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant30
          : MaterialYouTheme.primary.primary40,
      },
      tonal: {
        color: disabled 
          ? MaterialYouTheme.neutralVariant.neutralVariant30
          : MaterialYouTheme.primary.primary10,
      }
    };

    return {
      ...baseTextStyle,
      ...variantTextStyles[variant],
      fontWeight: '600',
    };
  };

  const getIconColor = () => {
    const variantIconColors = {
      filled: disabled 
        ? MaterialYouTheme.neutralVariant.neutralVariant30
        : MaterialYouTheme.primary.primary100,
      outlined: disabled 
        ? MaterialYouTheme.neutralVariant.neutralVariant30
        : MaterialYouTheme.primary.primary40,
      text: disabled 
        ? MaterialYouTheme.neutralVariant.neutralVariant30
        : MaterialYouTheme.primary.primary40,
      tonal: disabled 
        ? MaterialYouTheme.neutralVariant.neutralVariant30
        : MaterialYouTheme.primary.primary10,
    };

    return variantIconColors[variant];
  };

  const getIconSize = () => {
    return size === 'large' ? 20 : 18;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
        />
      );
    }

    const iconElement = icon && (
      <Ionicons 
        name={icon} 
        size={getIconSize()} 
        color={getIconColor()}
        style={[
          iconPosition === 'left' && title && { marginRight: Spacing.sm },
          iconPosition === 'right' && title && { marginLeft: Spacing.sm }
        ]}
      />
    );

    return (
      <>
        {iconPosition === 'left' && iconElement}
        {title && (
          <Text style={[getTextStyles(), textStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  const getRippleConfig = () => {
    const variantRippleColors = {
      filled: MaterialYouTheme.primary.primary80,
      outlined: MaterialYouTheme.primary.primary95,
      text: MaterialYouTheme.primary.primary95,
      tonal: MaterialYouTheme.primary.primary80,
    };

    return {
      color: variantRippleColors[variant],
      borderless: false,
      radius: 200
    };
  };

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: scaleValue }] },
        style
      ]}
    >
      <Pressable
        style={getButtonStyles()}
        onPress={disabled || loading ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={getRippleConfig()}
        {...props}
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

/**
 * 浮動操作按鈕 (FAB)
 */
export const MaterialFAB = ({ 
  icon = 'add',
  size = 'medium', // small, medium, large
  variant = 'primary', // primary, secondary, surface
  onPress,
  style,
  disabled = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.92,
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

  const getSizeConfig = () => {
    const sizeConfigs = {
      small: {
        width: 40,
        height: 40,
        iconSize: 20,
      },
      medium: {
        width: 56,
        height: 56,
        iconSize: 24,
      },
      large: {
        width: 96,
        height: 96,
        iconSize: 32,
      }
    };
    return sizeConfigs[size];
  };

  const getVariantStyles = () => {
    const variantStyles = {
      primary: {
        backgroundColor: MaterialYouTheme.primary.primary40,
        iconColor: MaterialYouTheme.primary.primary100,
      },
      secondary: {
        backgroundColor: MaterialYouTheme.secondary.secondary40,
        iconColor: MaterialYouTheme.secondary.secondary100,
      },
      surface: {
        backgroundColor: MaterialYouTheme.neutralVariant.neutralVariant90,
        iconColor: MaterialYouTheme.primary.primary40,
      }
    };
    return variantStyles[variant];
  };

  const sizeConfig = getSizeConfig();
  const variantStyle = getVariantStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        style={[
          styles.fab,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            backgroundColor: variantStyle.backgroundColor,
            opacity: disabled ? 0.6 : 1,
          },
          style
        ]}
        onPress={disabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        android_ripple={{
          color: MaterialYouTheme.primary.primary80,
          borderless: false,
          radius: sizeConfig.width / 2
        }}
        {...props}
      >
        <Ionicons 
          name={icon} 
          size={sizeConfig.iconSize} 
          color={variantStyle.iconColor}
        />
      </Pressable>
    </Animated.View>
  );
};

/**
 * 圖標按鈕
 */
export const MaterialIconButton = ({ 
  icon,
  size = 24,
  onPress,
  style,
  disabled = false,
  variant = 'standard', // standard, outlined, filled
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.90,
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

  const getVariantStyles = () => {
    const baseSize = 48;
    const variantStyles = {
      standard: {
        backgroundColor: 'transparent',
        iconColor: MaterialYouTheme.primary.primary40,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: MaterialYouTheme.neutralVariant.neutralVariant50,
        iconColor: MaterialYouTheme.primary.primary40,
      },
      filled: {
        backgroundColor: MaterialYouTheme.primary.primary40,
        iconColor: MaterialYouTheme.primary.primary100,
      }
    };

    return {
      ...variantStyles[variant],
      width: baseSize,
      height: baseSize,
      borderRadius: baseSize / 2,
    };
  };

  const variantStyle = getVariantStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Pressable
        style={[
          styles.iconButton,
          variantStyle,
          { opacity: disabled ? 0.6 : 1 },
          style
        ]}
        onPress={disabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        android_ripple={{
          color: MaterialYouTheme.primary.primary90,
          borderless: false,
          radius: 24
        }}
        {...props}
      >
        <Ionicons 
          name={icon} 
          size={size} 
          color={variantStyle.iconColor}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level3,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MaterialButton;
