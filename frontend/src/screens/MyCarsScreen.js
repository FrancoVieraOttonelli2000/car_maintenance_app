import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { carService, requestService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CarCard from '../components/CarCard';
import ButtonPrimary from '../components/ButtonPrimary';
import { Plus, ClipboardList, Trash2 } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const MyCarsScreen = ({ navigation }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:        language === 'es' ? 'Mi Garaje'                                                       : 'My Garage',
    emptyTitle:   language === 'es' ? 'Sin vehículos'                                                   : 'No vehicles found',
    emptyText:    language === 'es' ? 'Aún no has añadido ningún vehículo. Empieza añadiendo uno.'      : "You haven't added any vehicles yet. Start by adding one.",
    addFirst:     language === 'es' ? 'Añadir primer vehículo'                                          : 'Add First Vehicle',
    requestSentTitle: language === 'es' ? 'Solicitud enviada'                                           : 'Request sent',
    requestSentMsg:   language === 'es' ? 'Solicitud de borrado enviada, pendiente de aprobación de un gestor.' : 'Deletion request sent, pending manager approval.',
  };

  useFocusEffect(
    useCallback(() => {
      fetchCars();
    }, [])
  );

  const fetchCars = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const response = await carService.getUserCars(user.id);
        setCars(response.data);
      }
    } catch (error) {
      console.error('Error fetching cars', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCars();
  };

  const handleDelete = async (id) => {
    try {
      await requestService.create('delete_vehicle', { car_id: id });
      Alert.alert(t.requestSentTitle, t.requestSentMsg);
    } catch (error) {
      console.error('Error requesting car deletion', error);
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      Alert.alert('Error', msg);
    }
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.emptyTitle}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.emptyText}</Text>
        <ButtonPrimary onPress={() => navigation.navigate('AddCar')} style={styles.emptyButton}>
          {t.addFirst}
        </ButtonPrimary>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MaintenancePlan')}
            style={[styles.planButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <ClipboardList size={18} color={colors.primary} />
            <Text style={[styles.planButtonText, { color: colors.primary }]}>
              {language === 'es' ? 'Plan' : 'Plan'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddCar')}>
            <View style={[styles.addButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Plus size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.cardTouchable}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CarDetails', { id: item.id })}
            >
              <CarCard car={item} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  planButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});

export default MyCarsScreen;
