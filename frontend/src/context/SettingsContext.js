import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onUserChange } from '../services/api';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');
  const [unit, setUnit] = useState('km');
  // Rol del usuario con sesión iniciada: decide la paleta. Sin sesión, la del cliente.
  const [role, setRole] = useState('client');

  // Paletas por rol. El cliente mantiene sus colores (dorado sobre negro en
  // oscuro, azul en claro) y el gestor tiene los suyos (grafito y plata), para
  // que se note en todas las pantallas en qué modo se está.
  const themes = {
    client: {
      light: {
        background: '#f0f4f8',
        card: '#ffffff',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        primary: '#1d4ed8',
        onPrimary: '#ffffff',
        primarySoft: 'rgba(29,78,216,0.08)',
        danger: '#dc2626',
        iconBg: 'rgba(29,78,216,0.08)',
        headerBg: '#1d4ed8',
        headerText: '#ffffff',
        headerAccent: '#ffffff',
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
        onPrimary: '#ffffff',
        primarySoft: 'rgba(212,175,55,0.10)',
        danger: '#ef4444',
        iconBg: 'rgba(212,175,55,0.10)',
        headerBg: '#0D0D0D',
        headerText: '#D4AF37',
        headerAccent: '#D4AF37',
        inputBg: '#0D0D0D',
        inputText: '#D4AF37',
        inputBorder: '#2A2000',
        shadow: 'rgba(212,175,55,0.08)',
      },
    },
    manager: {
      light: {
        background: '#F3F3F4',
        card: '#ffffff',
        text: '#18181B',
        textSecondary: '#6B6B73',
        border: '#E2E2E5',
        primary: '#3F3F46',
        onPrimary: '#ffffff',
        primarySoft: 'rgba(63,63,70,0.08)',
        danger: '#dc2626',
        iconBg: 'rgba(63,63,70,0.08)',
        headerBg: '#27272A',
        headerText: '#ffffff',
        headerAccent: '#C9CDD3',
        inputBg: '#FAFAFA',
        inputText: '#18181B',
        inputBorder: '#D4D4D8',
        shadow: 'rgba(0,0,0,0.08)',
      },
      dark: {
        background: '#0B0B0C',
        card: '#161618',
        text: '#F2F2F3',
        textSecondary: '#9B9BA1',
        border: '#2A2A2E',
        primary: '#C9CDD3',
        onPrimary: '#0B0B0C',
        primarySoft: 'rgba(201,205,211,0.10)',
        danger: '#ef4444',
        iconBg: 'rgba(201,205,211,0.10)',
        headerBg: '#111113',
        headerText: '#F2F2F3',
        headerAccent: '#C9CDD3',
        inputBg: '#111113',
        inputText: '#F2F2F3',
        inputBorder: '#2A2A2E',
        shadow: 'rgba(0,0,0,0.4)',
      },
    },
  };

  useEffect(() => {
    loadSettings();
    // Cada vez que se guarda o se borra el usuario (login, refresco, cerrar
    // sesión) se actualiza la paleta.
    return onUserChange((user) => setRole(user?.role === 'manager' ? 'manager' : 'client'));
  }, []);

  const loadSettings = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      const storedLang = await AsyncStorage.getItem('language');
      const storedUnit = await AsyncStorage.getItem('unit');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser && JSON.parse(storedUser)?.role === 'manager') setRole('manager');
      
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
      role,
      isManager: role === 'manager',
      colors: themes[role][theme],
      updateSetting
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
