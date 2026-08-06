import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SettingsContext } from '../context/SettingsContext';

const ButtonPrimary = ({ children, onPress, disabled = false, variant = 'primary', style = {} }) => {
  const { colors } = useContext(SettingsContext);

  return (
    <TouchableOpacity
      onPress={disabled ? null : onPress}
      activeOpacity={0.8}
      style={[
        styles.button,
        variant === 'primary' && { backgroundColor: colors.primary, shadowColor: colors.primary },
        variant === 'primary' && styles.primaryShadow,
        variant === 'danger'  && { backgroundColor: colors.danger },
        variant === 'outline' && { borderColor: colors.primary, borderWidth: 1.5 },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[
        styles.text,
        variant === 'outline' ? { color: colors.primary } : { color: '#ffffff' },
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
});

export default ButtonPrimary;
