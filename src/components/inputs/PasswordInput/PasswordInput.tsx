import React, { useState, forwardRef } from 'react';
import { Text, StyleSheet, TextInput } from 'react-native';
import AppInput, { AppInputProps } from '../AppInput';
import { useTheme } from '../../../theme';

export interface PasswordInputProps extends Omit<AppInputProps, 'secureTextEntry' | 'rightIcon' | 'onRightIconPress'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<any, PasswordInputProps>(({
  showToggle = true,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  const eyeIcon = (
    <Text style={[styles.eyeText, { color: isDark ? '#96A1AD' : '#6B6154' }]}>
      {isVisible ? '👁️' : '👁️‍🗨️'}
    </Text>
  );

  return (
    <AppInput
      ref={ref}
      secureTextEntry={!isVisible}
      autoCapitalize="none"
      autoCorrect={false}
      rightIcon={showToggle ? eyeIcon : undefined}
      onRightIconPress={showToggle ? toggleVisibility : undefined}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  eyeText: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
});

export default PasswordInput;
