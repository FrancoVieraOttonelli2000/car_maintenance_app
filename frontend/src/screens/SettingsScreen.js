import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SettingsContext } from '../context/SettingsContext';

const SettingsScreen = () => {
  const { theme, language, unit, colors, updateSetting } = useContext(SettingsContext);

  const toggleTheme = () => {
    updateSetting('theme', theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    updateSetting('language', language === 'es' ? 'en' : 'es');
  };

  const toggleUnit = () => {
    updateSetting('unit', unit === 'km' ? 'mi' : 'km');
  };

  const showLegalNotices = () => {
    Alert.alert(
      language === 'es' ? 'Avisos Legales' : 'Legal Notices',
      language === 'es' ? 'Esta aplicación es para uso personal de mantenimiento de vehículos.' : 'This application is for personal vehicle maintenance use.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {language === 'es' ? 'Apariencia' : 'Appearance'}
        </Text>
        
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'es' ? 'Modo (Claro / Oscuro)' : 'Mode (Light / Dark)'}
          </Text>
          <Switch 
            value={theme === 'dark'} 
            onValueChange={toggleTheme} 
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={'#f4f3f4'}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>
          {language === 'es' ? 'Preferencias' : 'Preferences'}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'es' ? 'Idioma (Español / Inglés)' : 'Language (Spanish / English)'}
          </Text>
          <Switch 
            value={language === 'es'} 
            onValueChange={toggleLanguage} 
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={'#f4f3f4'}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'es' ? 'Unidades (KM / Millas)' : 'Units (KM / Miles)'}
          </Text>
          <Switch 
            value={unit === 'km'} 
            onValueChange={toggleUnit} 
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={'#f4f3f4'}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>
          {language === 'es' ? 'Acerca de' : 'About'}
        </Text>

        <TouchableOpacity style={styles.button} onPress={showLegalNotices}>
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            {language === 'es' ? 'Avisos Legales' : 'Legal Notices'}
          </Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Versión de la App' : 'App Version'}: 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
  }
});

export default SettingsScreen;
