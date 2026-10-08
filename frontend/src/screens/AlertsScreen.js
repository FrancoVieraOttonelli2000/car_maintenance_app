import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { alertService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertCard from '../components/AlertCard';
import { Bell } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:      language === 'es' ? 'Alertas de Mantenimiento'              : 'Maintenance Alerts',
    subtitle:   language === 'es' ? 'Tareas que requieren atención inmediata' : 'Tasks requiring your immediate attention',
    allClear:   language === 'es' ? '¡Todo al día!'                         : 'All Clear!',
    noPending:  language === 'es' ? 'Ninguno de tus vehículos tiene mantenimientos pendientes.' : 'None of your vehicles are currently overdue for maintenance.',
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const fetchAlerts = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const response = await alertService.getUserAlerts(user.id);
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: '#22c55e' }]}>{t.allClear}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noPending}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Bell size={32} color={colors.danger} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <AlertCard alert={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
  },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  listContainer: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { textAlign: 'center', lineHeight: 22 },
});

export default AlertsScreen;
