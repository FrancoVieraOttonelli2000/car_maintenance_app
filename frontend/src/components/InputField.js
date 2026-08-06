import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SettingsContext } from '../context/SettingsContext';

const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useContext(SettingsContext);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: isFocused ? colors.primary : colors.inputBorder,
            color: colors.inputText,
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
});

export default InputField;
