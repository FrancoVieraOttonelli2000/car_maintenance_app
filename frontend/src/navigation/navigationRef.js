import { createNavigationContainerRef } from '@react-navigation/native';

// Referencia global a la navegación, para poder redirigir desde fuera de una
// pantalla (por ejemplo, desde el interceptor de axios en services/api.js).
export const navigationRef = createNavigationContainerRef();

export const resetTo = (routeName) => {
  if (!navigationRef.isReady()) return;
  const current = navigationRef.getCurrentRoute()?.name;
  if (current === routeName) return;
  navigationRef.reset({ index: 0, routes: [{ name: routeName }] });
};
