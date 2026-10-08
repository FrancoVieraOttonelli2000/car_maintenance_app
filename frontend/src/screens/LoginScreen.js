import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { authService, subscriptionService, saveUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { Car } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:      language === 'es' ? 'AutoControl'                          : 'AutoControl',
    subtitle:   language === 'es' ? 'Gestiona el mantenimiento de tu coche': 'Manage your car maintenance',
    signIn:     language === 'es' ? 'Iniciar Sesión'                       : 'Sign In',
    signingIn:  language === 'es' ? 'Iniciando...'                         : 'Signing In...',
    noAccount:  language === 'es' ? '¿No tienes cuenta? '                  : "Don't have an account? ",
    register:   language === 'es' ? 'Crear Cuenta'                         : 'Create Account',
    emailLabel: language === 'es' ? 'Correo electrónico'                   : 'Email Address',
    passLabel:  language === 'es' ? 'Contraseña'                           : 'Password',
    fillFields: language === 'es' ? 'Por favor, rellena todos los campos'   : 'Please fill in all fields',
    wrongCreds: language === 'es' ? 'Email o contraseña incorrectos'       : 'Invalid email or password',
  };

  const handleLogin = async () => {
    if (!email || !password) { setError(t.fillFields); return; }
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({ email, password });
      await AsyncStorage.setItem('token', response.data.token);
      await saveUser(response.data);

      // Los gestores no tienen suscripción. Para los clientes, si no se puede
      // comprobar el estado se va a la pantalla de suscripción (que lo vuelve
      // a consultar y deja continuar si está activa). En cualquier caso, el
      // servidor también bloquea las rutas sin suscripción.
      let hasSubscription = true;
      if (response.data.role !== 'manager') {
        hasSubscription = false;
        try {
          const subRes = await subscriptionService.getStatus();
          hasSubscription = subRes.data?.active === true;
        } catch { hasSubscription = false; }
      }

      navigation.reset({
        index: 0,
        routes: [{ name: hasSubscription ? 'Home' : 'Subscription' }],
      });
    } catch (err) {
      setError(err.response?.data?.error || t.wrongCreds);
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
            <Car size={52} color="#ffffff" />
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
            label={t.emailLabel}
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <InputField
            label={t.passLabel}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <ButtonPrimary onPress={handleLogin} disabled={loading} style={styles.loginButton}>
            {loading ? t.signingIn : t.signIn}
          </ButtonPrimary>

          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.noAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>{t.register}</Text>
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
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
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
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: { marginTop: 8, marginBottom: 4 },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
