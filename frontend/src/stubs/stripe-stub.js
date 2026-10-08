export const useStripe = () => ({
  initPaymentSheet: async () => ({}),
  presentPaymentSheet: async () => ({}),
});

export const StripeProvider = ({ children }) => children;
