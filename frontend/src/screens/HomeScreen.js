import React, { useState, useCallback, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, saveUser } from '../services/api';
import { SettingsContext } from '../context/SettingsContext';
import ClientHomeScreen from './ClientHomeScreen';
import ManagerHomeScreen from './ManagerHomeScreen';

// Pantalla de inicio: muestra el panel del gestor o el del cliente según el
// rol. El rol se vuelve a pedir al servidor cada vez que se entra, así que si
// alguien es promovido a gestor ve su panel sin cerrar sesión.
const HomeScreen = ({ navigation }) => {
  const { colors } = useContext(SettingsContext);
  const [user, setUser] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      // Primero los datos guardados, para pintar algo al momento...
      try {
        const cached = await AsyncStorage.getItem('user');
        if (cached && active) setUser((prev) => prev || JSON.parse(cached));
      } catch { /* nada guardado */ }
      // ...y después los del servidor (rol, nombre o email pueden haber cambiado).
      try {
        const { data } = await authService.me();
        await saveUser(data);
        if (active) setUser(data);
      } catch { /* sin red: se sigue con los guardados */ }
    })();
    return () => { active = false; };
  }, []));

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return user.role === 'manager'
    ? <ManagerHomeScreen navigation={navigation} user={user} />
    : <ClientHomeScreen navigation={navigation} user={user} />;
};

export default HomeScreen;
