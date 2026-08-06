import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { UserPlus } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:      language === 'es' ? 'Crear Cuenta'                       : 'Create Account',
    subtitle:   language === 'es' ? 'Únete y gestiona tus vehículos'     : 'Join us and manage your vehicles',
    nameLabel:  language === 'es' ? 'Nombre completo'                    : 'Full Name',
    emailLabel: language === 'es' ? 'Correo electrónico'                 : 'Email Address',
    passLabel:  language === 'es' ? 'Contraseña'                         : 'Password',
    create:     language === 'es' ? 'Crear Cuenta'                       : 'Create Account',
    creating:   language === 'es' ? 'Creando cuenta...'                  : 'Creating Account...',
    hasAccount: language === 'es' ? '¿Ya tienes cuenta? '               : 'Already have an account? ',
    signIn:     language === 'es' ? 'Iniciar sesión'                     : 'Sign In',
    fillFields: language === 'es' ? 'Por favor, rellena todos los campos' : 'Please fill in all fields',
    failed:     language === 'es' ? 'Error al registrarse'               : 'Registration failed',
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError(t.fillFields); return; }
    setLoading(true);
    setError('');
    try {
      const response = await authService.register({ name, email, password });
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify({ id: response.data.id, name: response.data.name, email: response.data.email, role: response.data.role }));
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setError(err.response?.data?.error || t.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={styles.heroIconWrap}>
            <UserPlus size={48} color="#ffffff" />
          </View>
          <Text style={styles.heroTitle}>{t.title}</Text>
          <Text style={styles.heroSubtitle}>{t.subtitle}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#fef2f2', borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <InputField
            label={t.nameLabel}
            placeholder="Juan García"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <InputField
            label={t.emailLabel}
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label={t.passLabel}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ButtonPrimary onPress={handleRegister} disabled={loading} style={styles.registerButton}>
            {loading ? t.creating : t.create}
          </ButtonPrimary>

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.hasAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>{t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  heroSection: {
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  formCard: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
  registerButton: { marginTop: 8, marginBottom: 4 },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});

export default RegisterScreen;
