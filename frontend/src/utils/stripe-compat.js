import React, { createContext, useContext, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe as useStripeJs,
  useElements,
} from '@stripe/react-stripe-js';

// Native platforms get the real @stripe/stripe-react-native PaymentSheet
// (see stripe-compat.native.js). The PaymentSheet native module doesn't run
// on web, so here we implement the same initPaymentSheet/presentPaymentSheet
// contract on top of Stripe Elements, rendered in a modal.
const StripeSheetContext = createContext(null);

export const StripeProvider = ({ children, publishableKey }) => {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );
  const [sheet, setSheet] = useState(null); // { clientSecret, dark, visible, resolve }

  const initPaymentSheet = async ({ paymentIntentClientSecret, style }) => {
    if (!stripePromise) {
      return { error: { message: 'Stripe publishable key is missing' } };
    }
    setSheet({ clientSecret: paymentIntentClientSecret, dark: style === 'alwaysDark', visible: false, resolve: null });
    return {};
  };

  const presentPaymentSheet = () => {
    return new Promise((resolve) => {
      setSheet((prev) => (prev ? { ...prev, visible: true, resolve } : prev));
    });
  };

  const closeSheet = (result) => {
    setSheet((prev) => {
      prev?.resolve?.(result);
      return null;
    });
  };

  return (
    <StripeSheetContext.Provider value={{ initPaymentSheet, presentPaymentSheet }}>
      {children}
      {sheet?.visible && stripePromise && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => closeSheet({ error: { code: 'Canceled', message: 'Canceled' } })}
        >
          <View style={styles.backdrop}>
            <View style={[styles.card, sheet.dark && styles.cardDark]}>
              <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator>
                <Elements stripe={stripePromise} options={{ clientSecret: sheet.clientSecret }}>
                  <CheckoutForm dark={sheet.dark} onDone={closeSheet} />
                </Elements>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </StripeSheetContext.Provider>
  );
};

const CheckoutForm = ({ onDone, dark }) => {
  const stripeJs = useStripeJs();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePay = async () => {
    if (!stripeJs || !elements) return;
    setSubmitting(true);
    setErrorMsg('');

    const { error, paymentIntent } = await stripeJs.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      onDone({});
    } else {
      setErrorMsg('El pago no se pudo confirmar');
    }
  };

  return (
    <View>
      <Text style={[styles.title, dark && styles.textDark]}>Completar pago</Text>
      <View style={styles.elementWrap}>
        <PaymentElement />
      </View>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          disabled={submitting}
          onPress={() => onDone({ error: { code: 'Canceled', message: 'Canceled' } })}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payBtn} disabled={submitting || !stripeJs} onPress={handlePay}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.payText}>Pagar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const useStripe = () => {
  const ctx = useContext(StripeSheetContext);
  if (!ctx) {
    return {
      initPaymentSheet: async () => ({ error: { message: 'StripeProvider is not mounted' } }),
      presentPaymentSheet: async () => ({ error: { message: 'StripeProvider is not mounted' } }),
    };
  }
  return ctx;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardDark: {
    backgroundColor: '#141414',
  },
  cardContent: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#0f172a',
  },
  textDark: {
    color: '#D4AF37',
  },
  elementWrap: {
    marginBottom: 16,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelText: {
    fontWeight: '700',
    color: '#64748b',
  },
  payBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
  },
  payText: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
