import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');
  const [unit, setUnit] = useState('km');

  // Colors based on requested themes
  const themes = {
    light: {
      background: '#f0f4f8',
      card: '#ffffff',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      primary: '#1d4ed8',
      danger: '#dc2626',
      iconBg: 'rgba(29,78,216,0.08)',
      headerBg: '#1d4ed8',
      headerText: '#ffffff',
      inputBg: '#f8fafc',
      inputText: '#0f172a',
      inputBorder: '#cbd5e1',
      shadow: 'rgba(0,0,0,0.08)',
    },
    dark: {
      background: '#090909',
      card: '#141414',
      text: '#D4AF37',
      textSecondary: '#9A7D20',
      border: '#2A2000',
      primary: '#D4AF37',
      danger: '#ef4444',
      iconBg: 'rgba(212,175,55,0.10)',
      headerBg: '#0D0D0D',
      headerText: '#D4AF37',
      inputBg: '#0D0D0D',
      inputText: '#D4AF37',
      inputBorder: '#2A2000',
      shadow: 'rgba(212,175,55,0.08)',
    },
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      const storedLang = await AsyncStorage.getItem('language');
      const storedUnit = await AsyncStorage.getItem('unit');
      
      if (storedTheme) setTheme(storedTheme);
      if (storedLang) setLanguage(storedLang);
      if (storedUnit) setUnit(storedUnit);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      if (key === 'theme') setTheme(value);
      if (key === 'language') setLanguage(value);
      if (key === 'unit') setUnit(value);
    } catch (e) {
      console.error('Failed to save setting', e);
    }
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      language,
      unit,
      colors: themes[theme],
      updateSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
