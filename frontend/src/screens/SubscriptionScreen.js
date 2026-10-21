import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useStripe } from '../utils/stripe-compat';
import { Star, Check } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';
import { subscriptionService, clearSession } from '../services/api';

const PLANS = [
  {
    id: 'monthly',
    labelEs: 'Mensual',
    labelEn: 'Monthly',
    price: '2,99 €',
    periodEs: '/mes',
    periodEn: '/month',
    months: 1,
  },
  {
    id: 'semestral',
    labelEs: 'Semestral',
    labelEn: '6 Months',
    price: '16,49 €',
    periodEs: '/6 meses',
    periodEn: '/6 months',
    months: 6,
    tag: 'POPULAR',
    savingEs: 'Ahorra 1,45 €',
    savingEn: 'Save 1.45 €',
  },
  {
    id: 'annual',
    labelEs: 'Anual',
    labelEn: 'Annual',
    price: '29,99 €',
    periodEs: '/año',
    periodEn: '/year',
    months: 12,
    savingEs: 'Ahorra 5,89 €',
    savingEn: 'Save 5.89 €',
  },
];

const FEATURES_ES = [
  'Plan de mantenimiento personalizado',
  'Alertas de servicio inteligentes',
  'Historial de mantenimiento ilimitado',
  'Gestión de múltiples vehículos',
];
const FEATURES_EN = [
  'Personalised maintenance plan',
  'Smart service alerts',
  'Unlimited maintenance history',
  'Multi-vehicle management',
];

const PLAN_LABEL = {
  monthly:   { es: 'Mensual',   en: 'Monthly'  },
  semestral: { es: 'Semestral', en: '6 Months' },
  annual:    { es: 'Anual',     en: 'Annual'   },
};

export default function SubscriptionScreen({ navigation }) {
  const { colors, language } = useContext(SettingsContext);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [selectedPlan, setSelectedPlan] = useState('semestral');
  const [loading, setLoading] = useState(false);
  const [currentSub, setCurrentSub] = useState(null);

  const isGate = !navigation.canGoBack();
  const isDark = colors.background === '#090909';

  useEffect(() => {
    subscriptionService.getStatus()
      .then(r => setCurrentSub(r.data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await subscriptionService.createPaymentIntent(selectedPlan);
      const { clientSecret } = data;

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AutoControl',
        style: isDark ? 'alwaysDark' : 'automatic',
        primaryButtonLabel: language === 'es' ? 'Pagar' : 'Pay',
      });
      if (initError) throw new Error(initError.message);

      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== 'Canceled') Alert.alert('Error', payError.message);
        setLoading(false);
        return;
      }

      const paymentIntentId = clientSecret.split('_secret_')[0];
      // El servidor comprueba que el pago es tuyo y de qué plan es.
      await subscriptionService.activate(paymentIntentId);

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.error || err.message ||
          (language === 'es' ? 'Error al procesar el pago' : 'Payment processing error')
      );
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const features = language === 'es' ? FEATURES_ES : FEATURES_EN;

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>
          <Star size={34} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>AutoControl Premium</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {language === 'es'
            ? 'Gestiona tu vehículo sin límites'
            : 'Manage your vehicle without limits'}
        </Text>
      </View>

      {/* Current subscription status */}
      {currentSub?.active && (
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: '#22c55e44' }]}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Plan actual' : 'Current plan'}
          </Text>
          <Text style={[styles.statusPlan, { color: '#22c55e' }]}>
            ✓ {PLAN_LABEL[currentSub.plan]?.[language] ?? currentSub.plan}
          </Text>
          <Text style={[styles.statusExpiry, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Expira el' : 'Expires'} {formatDate(currentSub.expiresAt)}
          </Text>
          {isGate && (
            <TouchableOpacity
              style={[styles.continueBtn, { borderColor: colors.primary }]}
              onPress={goHome}
              activeOpacity={0.85}
            >
              <Text style={[styles.continueText, { color: colors.primary }]}>
                {language === 'es' ? 'Continuar a la app' : 'Continue to the app'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Features */}
      <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.checkWrap}>
              <Check size={14} color="#22c55e" />
            </View>
            <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Plans label */}
      <Text style={[styles.plansTitle, { color: colors.textSecondary }]}>
        {language === 'es'
          ? currentSub?.active ? 'RENOVAR / CAMBIAR PLAN' : 'ELIGE TU PLAN'
          : currentSub?.active ? 'RENEW / CHANGE PLAN' : 'CHOOSE YOUR PLAN'}
      </Text>

      {/* Plan cards */}
      {PLANS.map(plan => {
        const isSelected = selectedPlan === plan.id;
        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
              isSelected && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            {plan.tag && (
              <View style={[styles.tagBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.tagText, { color: isDark ? '#000' : '#fff' }]}>{plan.tag}</Text>
              </View>
            )}
            <View style={styles.planRow}>
              <View style={styles.planLeft}>
                <Text style={[styles.planName, { color: colors.text }]}>
                  {language === 'es' ? plan.labelEs : plan.labelEn}
                </Text>
                {plan.savingEs && (
                  <Text style={styles.saving}>
                    {language === 'es' ? plan.savingEs : plan.savingEn}
                  </Text>
                )}
              </View>
              <View style={styles.planRight}>
                <Text style={[styles.planPrice, { color: colors.primary }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>
                  {language === 'es' ? plan.periodEs : plan.periodEn}
                </Text>
              </View>
              <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: colors.primary }, loading && styles.ctaDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={isDark ? '#000' : '#fff'} />
          : <Text style={[styles.ctaText, { color: isDark ? '#000' : '#fff' }]}>
              {language === 'es'
                ? currentSub?.active ? 'Renovar suscripción' : 'Suscribirme ahora'
                : currentSub?.active ? 'Renew subscription' : 'Subscribe now'}
            </Text>
        }
      </TouchableOpacity>

      <Text style={[styles.legal, { color: colors.textSecondary }]}>
        {language === 'es'
          ? 'Sin renovación automática. Acceso durante el periodo seleccionado.'
          : 'No automatic renewal. Access for the selected period.'}
      </Text>

      {isGate && (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutLink}>
          <Text style={[styles.logoutText, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Cerrar sesión' : 'Log out'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center' },
  statusCard: {
    borderRadius: 12, borderWidth: 1.5,
    padding: 14, marginBottom: 16, alignItems: 'center', gap: 4,
  },
  statusLabel: { fontSize: 12, fontWeight: '500' },
  statusPlan: { fontSize: 16, fontWeight: '800' },
  statusExpiry: { fontSize: 12 },
  continueBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center',
  },
  continueText: { fontSize: 14, fontWeight: '700' },
  logoutLink: { marginTop: 18, alignItems: 'center', paddingVertical: 8 },
  logoutText: { fontSize: 13, textDecorationLine: 'underline' },
  featuresCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 10,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#22c55e22', alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 14, fontWeight: '500', flex: 1 },
  plansTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  planCard: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    marginBottom: 10, overflow: 'hidden',
  },
  planCardSelected: { borderWidth: 2 },
  tagBadge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planLeft: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '700' },
  saving: { fontSize: 12, color: '#22c55e', fontWeight: '600', marginTop: 2 },
  planRight: { alignItems: 'flex-end', marginRight: 10 },
  planPrice: { fontSize: 20, fontWeight: '900' },
  planPeriod: { fontSize: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  ctaBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 14,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 17, fontWeight: '800' },
  legal: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
