// @ts-nocheck
// This is a component file, not a route
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../../themes/MaterialYouTheme';

/**
 * Material You 風格文字輸入框
 */
export const MaterialTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  variant = 'outlined', // outlined, filled
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isLabelAnimated, setIsLabelAnimated] = useState(false);
  
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    const shouldAnimateLabel = isFocused || value;
    
    Animated.timing(labelAnimation, {
      toValue: shouldAnimateLabel ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    setIsLabelAnimated(shouldAnimateLabel);
  }, [isFocused, value]);

  useEffect(() => {
    Animated.timing(borderAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getContainerStyles = () => {
    const baseStyle = {
      marginVertical: Spacing.sm,
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
        borderTopLeftRadius: BorderRadius.sm,
        borderTopRightRadius: BorderRadius.sm,
        borderBottomWidth: isFocused ? 2 : 1,
        borderBottomColor: error
          ? MaterialYouTheme.error.error40
          : isFocused
          ? MaterialYouTheme.primary.primary40
          : MaterialYouTheme.neutralVariant.neutralVariant50,
      };
    }

    // outlined variant
    const borderColor = error
      ? MaterialYouTheme.error.error40
      : isFocused
      ? MaterialYouTheme.primary.primary40
      : MaterialYouTheme.neutralVariant.neutralVariant50;

    return {
      ...baseStyle,
      borderWidth: isFocused ? 2 : 1,
      borderColor,
      borderRadius: BorderRadius.sm,
      backgroundColor: MaterialYouTheme.surface.surface,
    };
  };

  const getLabelStyles = () => {
    const animatedTop = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 20 : 16, -8],
    });

    const animatedFontSize = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    });

    const animatedBackgroundColor = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [
        'transparent',
        variant === 'outlined' ? MaterialYouTheme.surface.surface : 'transparent'
      ],
    });

    return {
      position: 'absolute',
      left: leadingIcon ? 48 : 16,
      top: animatedTop,
      fontSize: animatedFontSize,
      backgroundColor: animatedBackgroundColor,
      paddingHorizontal: variant === 'outlined' && isLabelAnimated ? 4 : 0,
      color: error
        ? MaterialYouTheme.error.error40
        : isFocused
        ? MaterialYouTheme.primary.primary40
        : MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
      zIndex: 1,
    };
  };

  const getInputStyles = () => {
    return {
      flex: 1,
      paddingTop: variant === 'filled' ? Spacing.lg : Spacing.md,
      paddingBottom: variant === 'filled' ? Spacing.sm : Spacing.md,
      paddingLeft: leadingIcon ? 48 : Spacing.md,
      paddingRight: trailingIcon ? 48 : Spacing.md,
      fontSize: 16,
      color: MaterialYouTheme.onSurface.onSurface,
      textAlignVertical: multiline ? 'top' : 'center',
      minHeight: multiline ? 80 : Platform.OS === 'ios' ? 20 : 24,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {/* 輸入框容器 */}
      <View style={[styles.inputContainer, getContainerStyles()]}>
        {/* 前置圖標 */}
        {leadingIcon && (
          <View style={styles.leadingIcon}>
            <Ionicons
              name={leadingIcon}
              size={24}
              color={isFocused
                ? MaterialYouTheme.primary.primary40
                : MaterialYouTheme.onSurfaceVariant.onSurfaceVariant
              }
            />
          </View>
        )}

        {/* 標籤 */}
        {label && (
          <Animated.Text style={[Typography.bodyLarge, getLabelStyles()]}>
            {label}
          </Animated.Text>
        )}

        {/* 輸入欄 */}
        <TextInput
          ref={inputRef}
          style={[getInputStyles(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={!isLabelAnimated ? placeholder : ''}
          placeholderTextColor={MaterialYouTheme.onSurfaceVariant.onSurfaceVariant}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          selectionColor={MaterialYouTheme.primary.primary40}
          {...props}
        />

        {/* 後置圖標 */}
        {trailingIcon && (
          <TouchableOpacity
            style={styles.trailingIcon}
            onPress={onTrailingIconPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={trailingIcon}
              size={24}
              color={isFocused
                ? MaterialYouTheme.primary.primary40
                : MaterialYouTheme.onSurfaceVariant.onSurfaceVariant
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 錯誤訊息或幫助文字 */}
      {(error || helperText) && (
        <View style={styles.supportingText}>
          <Text
            style={[
              Typography.bodySmall,
              {
                color: error
                  ? MaterialYouTheme.error.error40
                  : MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
              },
            ]}
          >
            {error || helperText}
          </Text>
          {maxLength && (
            <Text style={[Typography.bodySmall, styles.characterCounter]}>
              {value?.length || 0}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * 搜尋輸入框
 */
export const MaterialSearchInput = ({
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  placeholder = '搜尋...',
  showFilter = false,
  onFilterPress,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.searchContainer, style]}>
      <View style={[styles.searchInputContainer, isFocused && styles.searchInputFocused]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={MaterialYouTheme.onSurfaceVariant.onSurfaceVariant}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={MaterialYouTheme.onSurfaceVariant.onSurfaceVariant}
          returnKeyType="search"
          selectionColor={MaterialYouTheme.primary.primary40}
          {...props}
        />

        {value ? (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={MaterialYouTheme.onSurfaceVariant.onSurfaceVariant}
            />
          </TouchableOpacity>
        ) : null}

        {showFilter && (
          <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
            <Ionicons
              name="filter-outline"
              size={20}
              color={MaterialYouTheme.primary.primary40}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * 選擇器組件
 */
export const MaterialSelector = ({
  options = [],
  selectedValue,
  onSelect,
  placeholder = '請選擇',
  label,
  error,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);

  return (
    <View style={[styles.selectorContainer, style]}>
      {label && (
        <Text style={[Typography.labelMedium, styles.selectorLabel]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selectorButton,
          error && styles.selectorError,
          isOpen && styles.selectorOpen
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            Typography.bodyLarge,
            styles.selectorText,
            !selectedOption && styles.selectorPlaceholder
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={MaterialYouTheme.onSurfaceVariant.onSurfaceVariant}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                selectedValue === option.value && styles.optionSelected
              ]}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  Typography.bodyLarge,
                  styles.optionText,
                  selectedValue === option.value && styles.optionTextSelected
                ]}
              >
                {option.label}
              </Text>
              
              {selectedValue === option.value && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={MaterialYouTheme.primary.primary40}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={[Typography.bodySmall, styles.errorText]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // 文字輸入框樣式
  container: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leadingIcon: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 2,
  },
  trailingIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
    zIndex: 2,
  },
  supportingText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  characterCounter: {
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
  },

  // 搜尋輸入框樣式
  searchContainer: {
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MaterialYouTheme.surfaceVariant.surfaceVariant,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInputFocused: {
    borderColor: MaterialYouTheme.primary.primary40,
    ...Elevation.level1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: MaterialYouTheme.onSurface.onSurface,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
  filterButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },

  // 選擇器樣式
  selectorContainer: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  selectorLabel: {
    color: MaterialYouTheme.onSurface.onSurface,
    marginBottom: Spacing.xs,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: MaterialYouTheme.neutralVariant.neutralVariant50,
    borderRadius: BorderRadius.sm,
    backgroundColor: MaterialYouTheme.surface.surface,
  },
  selectorError: {
    borderColor: MaterialYouTheme.error.error40,
  },
  selectorOpen: {
    borderColor: MaterialYouTheme.primary.primary40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectorText: {
    color: MaterialYouTheme.onSurface.onSurface,
  },
  selectorPlaceholder: {
    color: MaterialYouTheme.onSurfaceVariant.onSurfaceVariant,
  },
  optionsContainer: {
    backgroundColor: MaterialYouTheme.surface.surface,
    borderWidth: 1,
    borderColor: MaterialYouTheme.primary.primary40,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
    ...Elevation.level2,
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MaterialYouTheme.neutralVariant.neutralVariant90,
  },
  optionSelected: {
    backgroundColor: MaterialYouTheme.primary.primary95,
  },
  optionText: {
    color: MaterialYouTheme.onSurface.onSurface,
  },
  optionTextSelected: {
    color: MaterialYouTheme.primary.primary40,
    fontWeight: '600',
  },
  errorText: {
    color: MaterialYouTheme.error.error40,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});

export default {
  MaterialTextInput,
  MaterialSearchInput,
  MaterialSelector,
};
