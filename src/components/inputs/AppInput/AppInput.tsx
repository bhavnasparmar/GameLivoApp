import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Pressable,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useTheme } from '../../../theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  isRequired?: boolean;
}

export const AppInput = forwardRef<any, AppInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  labelStyle,
  errorStyle,
  isRequired,
  onFocus,
  onBlur,
  style,
  placeholderTextColor,
  ...restProps
}, ref) => {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef<any>(null);

  useImperativeHandle(ref, () => internalInputRef.current);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleContainerPress = () => {
    internalInputRef.current?.focus();
  };

  const borderColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.accentLight || theme.colors.accent
    : isDark
    ? 'rgba(255,255,255,0.1)'
    : theme.colors.border;

  const backgroundColor = isDark ? '#20252D' : '#F0F4F1';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleContainerPress}
          style={styles.labelRow}
        >
          <Text
            style={[
              styles.label,
              { color: isDark ? '#B8C8BE' : theme.colors.textSecondary },
              labelStyle,
            ]}
          >
            {label}
            {isRequired ? <Text style={{ color: theme.colors.error }}> *</Text> : null}
          </Text>
        </TouchableOpacity>
      ) : null}

      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor,
          },
          isFocused && styles.inputContainerFocused,
          Boolean(error) && styles.inputContainerError,
          inputContainerStyle,
        ]}
      >
        {leftIcon ? (
          <View pointerEvents="none" style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        ) : null}

        <TextInput
          ref={internalInputRef}
          style={[
            styles.input,
            {
              color: isDark ? '#FFFFFF' : '#0D1B12',
            },
            style,
          ]}
          placeholderTextColor={
            placeholderTextColor || (isDark ? '#6E7D73' : '#8E9E95')
          }
          onFocus={handleFocus}
          onBlur={handleBlur}
          underlineColorAndroid="transparent"
          {...restProps}
        />

        {rightIcon ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </Pressable>

      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error }, errorStyle]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.helperText,
            { color: isDark ? '#7A9485' : theme.colors.textTertiary },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  inputContainerFocused: {
    shadowColor: '#D6A83A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerError: {
    shadowColor: '#E5584A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 2,
  },
  helperText: {
    fontSize: 11.5,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default AppInput;
