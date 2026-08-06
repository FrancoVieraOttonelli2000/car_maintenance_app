import React, { useContext } from 'react';
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

const STRIPE_PK = 'pk_test_51Tis84HGtfUz8qJRL7WUqODZLN04VtRcl43cJN3tHS3V3SDlQFGQikDjJn352pRZB7guGNAQKQud5xPVmLbV9dHq00tD5nJJHR';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { colors, theme, language } = useContext(SettingsContext);

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

  return (
    <NavigationContainer>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Login"
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
