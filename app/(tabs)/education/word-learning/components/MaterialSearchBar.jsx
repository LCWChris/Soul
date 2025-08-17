import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Animated
} from 'react-native';
import { MaterialYouTheme, Typography, Spacing, BorderRadius, Elevation } from '../MaterialYouTheme';

const MaterialSearchBar = ({ 
  placeholder = "搜尋單詞...", 
  onSearchChange, 
  onFocus, 
  onBlur,
  value,
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState(value || '');
  const animatedValue = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const handleChangeText = (text) => {
    setSearchValue(text);
    onSearchChange && onSearchChange(text);
  };

  const clearSearch = () => {
    setSearchValue('');
    onSearchChange && onSearchChange('');
  };

  const animatedBorderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [MaterialYouTheme.neutral.neutral80, MaterialYouTheme.primary.primary50],
  });

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [MaterialYouTheme.neutralVariant.neutralVariant95, MaterialYouTheme.neutralVariant.neutralVariant90],
  });

  return (
    <Animated.View style={[
      styles.container,
      {
        borderColor: animatedBorderColor,
        backgroundColor: animatedBackgroundColor,
      }
    ]}>
      <View style={styles.searchIcon}>
        <Text style={styles.searchIconText}>🔍</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={MaterialYouTheme.neutral.neutral50}
        value={searchValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        selectionColor={MaterialYouTheme.primary.primary50}
      />
      
      {searchValue.length > 0 && (
        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 56,
    ...Elevation.level1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchIconText: {
    fontSize: 20,
    color: MaterialYouTheme.neutral.neutral50,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: MaterialYouTheme.neutral.neutral20,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: MaterialYouTheme.neutral.neutral50,
    fontWeight: '500',
  },
});

export default MaterialSearchBar;
