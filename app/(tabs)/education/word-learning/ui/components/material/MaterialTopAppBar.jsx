import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, Elevation } from '../../themes/MaterialYouTheme';

// 計�? iPhone ?��圖標��圖標��圖標��?�?
const getTopSafeAreaPadding = (isMainScreen = false) => {
  if (Platform.OS === 'ios') {
    const { height, width } = Dimensions.get('window');
    // 主�?幕�圖標��圖標��?）使?�更小�圖標��?
    if (isMainScreen) {
      if (height >= 926 || width >= 926) return 5; // ?��?島�圖標��?�?0減�圖標?
      if (height >= 812 || width >= 812) return 3; // ?�海機�?：�?15減�圖標?
      return 2; // ?��? iPhone：�?10減�圖標?
    }
    // ?��圖標�面使用�?��?��?
    if (height >= 926 || width >= 926) return 35;
    if (height >= 812 || width >= 812) return 30;
    return 25;
  }
  // Android 裝置
  return isMainScreen ? 5 : 20;
};

const MaterialTopAppBar = ({ 
  title, 
  subtitle, 
  showBackButton = true, 
  actions = [], 
  variant = 'small',
  onBackPress,
  isMainScreen = false // ?��圖標��圖標�否?�主屏�?（�?類選?��?段�?
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getHeightByVariant = () => {
    const baseHeight = (() => {
      switch (variant) {
        case 'medium':
          return 112;
        case 'large':
          return 152;
        default: // small
          return 64;
      }
    })();
    
    // ?��?安全?��?（根?�是?�為主�?幕調?��?
    return baseHeight + getTopSafeAreaPadding(isMainScreen);
  };

  return (
    <>
      <StatusBar 
        backgroundColor="#F1F5FF" 
        barStyle="dark-content" 
      />
      <View style={[
        styles.container, 
        { 
          height: getHeightByVariant(),
          paddingTop: getTopSafeAreaPadding(isMainScreen) + Spacing.sm
        }
      ]}>
        <View style={styles.topRow}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={MaterialYouTheme.neutral.neutral30} />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={[
              variant === 'large' ? styles.titleLarge : styles.titleSmall,
              styles.title
            ]}>
              {title}
            </Text>
            {subtitle && variant !== 'small' && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
          
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {typeof action.icon === 'string' && action.icon.length <= 2 ? (
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                ) : (
                  <Ionicons name={action.icon} size={24} color={MaterialYouTheme.neutral.neutral30} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {subtitle && variant === 'small' && (
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm, // ?�裡?�被?��?覆�?
    justifyContent: 'flex-end',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutral.neutral90,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: MaterialYouTheme.neutral.neutral20,
    fontWeight: '500',
  },
  titleSmall: {
    ...Typography.titleLarge,
  },
  titleLarge: {
    ...Typography.headlineMedium,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: MaterialYouTheme.neutral.neutral50,
    marginTop: 2,
  },
  subtitleRow: {
    paddingLeft: 56,
    paddingBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  actionIcon: {
    fontSize: 24,
    color: MaterialYouTheme.neutral.neutral30,
  },
});

export default MaterialTopAppBar;
