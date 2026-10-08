import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from './src/utils/stripe-compat';
import { SettingsProvider, SettingsContext } from './src/context/SettingsContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyCarsScreen from './src/screens/MyCarsScreen';
import CarDetailsScreen from './src/screens/CarDetailsScreen';
import AddCarScreen from './src/screens/AddCarScreen';
import AddMaintenanceScreen from './src/screens/AddMaintenanceScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MaintenancePlanScreen from './src/screens/MaintenancePlanScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import CarAssistantScreen from './src/screens/CarAssistantScreen';
import ManagerRequestsScreen from './src/screens/ManagerRequestsScreen';
import ManagerUsersScreen from './src/screens/ManagerUsersScreen';
import { navigationRef } from './src/navigation/navigationRef';
import { authService, subscriptionService, saveUser } from './src/services/api';

// La clave publicable de Stripe es pública por diseño (no es un secreto),
// pero se puede cambiar sin tocar código con EXPO_PUBLIC_STRIPE_PK en frontend/.env
const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PK
  || 'pk_test_51Tis84HGtfUz8qJRL7WUqODZLN04VtRcl43cJN3tHS3V3SDlQFGQikDjJn352pRZB7guGNAQKQud5xPVmLbV9dHq00tD5nJJHR';

// Decide la pantalla inicial: si hay un token guardado y sigue siendo válido,
// se entra directamente sin pedir login otra vez.
const resolveInitialRoute = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return 'Login';

  try {
    const { data: user } = await authService.me();
    await saveUser(user);
    if (user.role === 'manager') return 'Home';
    const { data: sub } = await subscriptionService.getStatus();
    return sub?.active ? 'Home' : 'Subscription';
  } catch (error) {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      return 'Login';
    }
    // Sin conexión: se entra con los datos guardados. El servidor sigue
    // comprobando la suscripción en cada petición.
    const cached = await AsyncStorage.getItem('user');
    return cached ? 'Home' : 'Login';
  }
};

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { colors, theme, language } = useContext(SettingsContext);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    resolveInitialRoute()
      .then(setInitialRoute)
      .catch(() => setInitialRoute('Login'));
  }, []);

  const T = {
    home:        language === 'es' ? 'Inicio'               : 'Home',
    myCars:      language === 'es' ? 'Mi Garaje'            : 'My Garage',
    carDetails:  language === 'es' ? 'Detalles del Vehículo': 'Vehicle Details',
    addCar:      language === 'es' ? 'Añadir Vehículo'      : 'Add Vehicle',
    addMaint:    language === 'es' ? 'Registrar Servicio'   : 'Record Service',
    alerts:      language === 'es' ? 'Avisos'               : 'Alerts',
    settings:    language === 'es' ? 'Ajustes'              : 'Settings',
    maintPlan:   language === 'es' ? 'Plan de Mantenimiento': 'Maintenance Plan',
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login"          component={LoginScreen}          options={{ headerShown: false }} />
        <Stack.Screen name="Register"       component={RegisterScreen}       options={{ headerShown: false }} />
        <Stack.Screen name="Home"           component={HomeScreen}           options={{ title: T.home }} />
        <Stack.Screen name="MyCars"         component={MyCarsScreen}         options={{ title: T.myCars }} />
        <Stack.Screen name="CarDetails"     component={CarDetailsScreen}     options={{ title: T.carDetails }} />
        <Stack.Screen name="AddCar"         component={AddCarScreen}         options={{ title: T.addCar }} />
        <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} options={{ title: T.addMaint }} />
        <Stack.Screen name="Alerts"         component={AlertsScreen}         options={{ title: T.alerts }} />
        <Stack.Screen name="Settings"       component={SettingsScreen}       options={{ title: T.settings }} />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: language === 'es' ? 'Mi Perfil' : 'My Profile' }}
        />
        <Stack.Screen name="MaintenancePlan" component={MaintenancePlanScreen} options={{ title: T.maintPlan }} />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ title: language === 'es' ? 'Suscripción' : 'Subscription' }}
        />
        <Stack.Screen
          name="CarAssistant"
          component={CarAssistantScreen}
          options={{ title: language === 'es' ? 'Ficha técnica' : 'Vehicle specs' }}
        />
        <Stack.Screen
          name="ManagerRequests"
          component={ManagerRequestsScreen}
          options={{ title: language === 'es' ? 'Solicitudes' : 'Requests' }}
        />
        <Stack.Screen
          name="ManagerUsers"
          component={ManagerUsersScreen}
          options={{ title: language === 'es' ? 'Usuarios' : 'Users' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.com.autocontrol">
        <AppNavigator />
      </StripeProvider>
    </SettingsProvider>
  );
}
