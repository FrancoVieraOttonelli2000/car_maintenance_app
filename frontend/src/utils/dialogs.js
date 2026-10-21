import { Alert, Platform } from 'react-native';

// Alert.alert de React Native no hace nada en la versión web, así que allí se
// usan los diálogos del navegador. En Android/iOS se usa el Alert nativo.

export const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

// Pide confirmación y, si se acepta, llama a onConfirm.
export const confirmAction = ({ title, message, confirmText, cancelText, destructive = false, onConfirm }) => {
  if (Platform.OS === 'web') {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
};
