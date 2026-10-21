import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { carService, maintenanceService, maintenancePlanService } from '../services/api';
import ButtonPrimary from '../components/ButtonPrimary';
import InputField from '../components/InputField';
import MaintenanceItem from '../components/MaintenanceItem';
import FuelBadge from '../components/FuelBadge';
import { Car, Edit3, Plus, Gauge, Zap } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const toDisplay = (km, unit) => unit === 'mi' ? Math.round(km * 0.621371) : km;
const toKm = (val, unit) => unit === 'mi' ? Math.round(val / 0.621371) : val;
const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

const CarDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { colors, language, unit } = useContext(SettingsContext);

  const [car, setCar] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateKm, setShowUpdateKm] = useState(false);
  const [newKm, setNewKm] = useState('');
  const [alertasPlan, setAlertasPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useFocusEffect(
    useCallback(() => { fetchCarData(); }, [id])
  );

  const fetchCarData = async () => {
    try {
      const [carRes, maintRes] = await Promise.all([
        carService.getCarById(id),
        maintenanceService.getCarMaintenance(id),
      ]);
      setCar(carRes.data);
      setMaintenance(maintRes.data);
      setNewKm(toDisplay(carRes.data.current_km, unit).toString());
    } catch (e) { console.error('Error fetching car details', e?.message); }
    finally { setLoading(false); setRefreshing(false); }

    setLoadingPlan(true);
    try {
      const alertasRes = await maintenancePlanService.getAlertasByCar(id);
      setAlertasPlan(alertasRes.data);
    } catch { setAlertasPlan([]); }
    finally { setLoadingPlan(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchCarData(); };

  const handleUpdateKm = async () => {
    const newVal = parseInt(newKm, 10);
    const currentDisplay = toDisplay(car.current_km, unit);
    if (!newKm || newVal < currentDisplay) {
      Alert.alert('Error', language === 'es'
        ? `El nuevo valor no puede ser menor al actual (${currentDisplay} ${unit.toUpperCase()})`
        : `New value cannot be less than current (${currentDisplay} ${unit.toUpperCase()})`);
      return;
    }
    try {
      await carService.updateKm(id, { km: toKm(newVal, unit), date: new Date().toISOString() });
      setShowUpdateKm(false);
      fetchCarData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update KM');
    }
  };

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {language === 'es' ? 'Cargando...' : 'Loading...'}
      </Text>
    </View>
  );
  if (!car) return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {language === 'es' ? 'Vehículo no encontrado' : 'Car not found'}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Vehicle header card */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroIconWrap}>
          <Car size={36} color={colors.onPrimary} />
        </View>
        <View style={styles.heroText}>
          <Text style={[styles.heroBrand, { color: colors.onPrimary }]}>{car.brand} {car.model}</Text>
          <Text style={[styles.heroPlate, { color: colors.onPrimary }]}>{car.plate}</Text>
        </View>
      </View>

      {/* Details card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Año' : 'Year'}
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{car.year}</Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Motor' : 'Engine'}
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{car.engine}</Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'Combustible' : 'Fuel'}
          </Text>
          <FuelBadge fuel={car.fuel} language={language} />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={[styles.kmRow, { backgroundColor: colors.iconBg }]}>
          <View style={styles.kmLeft}>
            <Gauge size={18} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {language === 'es' ? 'Kilometraje actual' : 'Current Mileage'}
            </Text>
          </View>
          <Text style={[styles.kmValue, { color: colors.primary }]}>
            {toDisplay(car.current_km, unit)?.toLocaleString()} {unit.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Update KM */}
      {showUpdateKm ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InputField
            label={language === 'es'
              ? (unit === 'km' ? 'Nuevos kilómetros' : 'Nuevas millas')
              : (unit === 'km' ? 'New kilometers' : 'New miles')
            }
            type="number"
            value={newKm}
            onChangeText={setNewKm}
            keyboardType="numeric"
          />
          <View style={styles.updateButtons}>
            <ButtonPrimary style={styles.flex1} onPress={handleUpdateKm}>
              {language === 'es' ? 'Guardar' : 'Save'}
            </ButtonPrimary>
            <ButtonPrimary style={styles.flex1} variant="outline" onPress={() => setShowUpdateKm(false)}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </ButtonPrimary>
          </View>
        </View>
      ) : (
        <ButtonPrimary variant="outline" onPress={() => setShowUpdateKm(true)}>
          <Edit3 size={16} color={colors.primary} /> {language === 'es'
            ? (unit === 'km' ? 'Actualizar Kilometraje' : 'Actualizar Millaje')
            : (unit === 'km' ? 'Update Kilometers' : 'Update Mileage')
          }
        </ButtonPrimary>
      )}

      {/* Maintenance section */}
      <View style={styles.maintenanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'es' ? 'Historial de Mantenimiento' : 'Maintenance History'}
          </Text>
          <ButtonPrimary
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddMaintenance', { id: car.id })}
          >
            <Plus size={15} color={colors.onPrimary} /> {language === 'es' ? 'Añadir' : 'Add'}
          </ButtonPrimary>
        </View>

        {maintenance.length > 0 ? (
          maintenance.map(record => (
            <MaintenanceItem key={record.id} maintenance={record} />
          ))
        ) : (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'es' ? 'Sin registros de mantenimiento.' : 'No maintenance records yet.'}
            </Text>
          </View>
        )}
      </View>

      {/* Plan de Mantenimiento */}
      <View style={styles.maintenanceSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'es' ? 'Plan de Mantenimiento' : 'Maintenance Plan'}
        </Text>

        {loadingPlan ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
        ) : alertasPlan.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border, marginTop: 14 }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === 'es'
                ? 'No hay plan de mantenimiento disponible para este vehículo.'
                : 'No maintenance plan available for this vehicle.'}
            </Text>
          </View>
        ) : (
          <>
            {alertasPlan.map((item, idx) => {
              const badge = item.vencido
                ? { bg: '#FFCDD2', text: '#B71C1C', label: language === 'es' ? '⚠ VENCIDO' : '⚠ OVERDUE' }
                : item.urgente
                ? { bg: '#FFCDD2', text: '#B71C1C', label: language === 'es' ? '⚠ URGENTE' : '⚠ URGENT' }
                : item.alerta
                ? { bg: '#FFE0B2', text: '#E65100', label: language === 'es' ? '! Próximo' : '! Due Soon' }
                : { bg: '#C8E6C9', text: '#2E7D32', label: '✓ OK' };

              const vencidoKm = item.kmRestantes !== null && item.kmRestantes <= 0;
              const detailText = vencidoKm
                ? (language === 'es'
                    ? `Llevas ${toDisplay(-item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()} de retraso (debía tocar a los ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()})`
                    : `Overdue by ${toDisplay(-item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()} (was due at ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()})`)
                : (language === 'es'
                    ? `Próximo a los ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()} (faltan ${toDisplay(item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()})`
                    : `Next at ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()} (${toDisplay(item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()} left)`);

              return (
                <View key={item.operacion || idx} style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.planCardHeader}>
                    <Text style={[styles.planOpName, { color: colors.text }]}>{item.operacion}</Text>
                    <View style={[styles.planBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.planBadgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.planDetail, { color: colors.textSecondary }]}>
                    {detailText}
                  </Text>
                  {item.proximaFecha ? (
                    <Text style={[styles.planDetail, { color: colors.textSecondary }]}>
                      {language === 'es'
                        ? (item.diasRestantes <= 0
                            ? `Por tiempo: tocaba el ${formatDate(item.proximaFecha)}`
                            : `Por tiempo: antes del ${formatDate(item.proximaFecha)}`)
                        : (item.diasRestantes <= 0
                            ? `By time: was due ${formatDate(item.proximaFecha)}`
                            : `By time: before ${formatDate(item.proximaFecha)}`)}
                    </Text>
                  ) : null}
                  <Text style={[styles.planDetail, { color: colors.textSecondary }]}>
                    {item.ultimoKm !== null && item.ultimoKm !== undefined
                      ? (language === 'es'
                          ? `Último registro: ${toDisplay(item.ultimoKm, unit)?.toLocaleString()} ${unit.toUpperCase()}${item.ultimaFecha ? ` (${formatDate(item.ultimaFecha)})` : ''}`
                          : `Last done: ${toDisplay(item.ultimoKm, unit)?.toLocaleString()} ${unit.toUpperCase()}${item.ultimaFecha ? ` (${formatDate(item.ultimaFecha)})` : ''}`)
                      : (language === 'es' ? 'Sin registros en la app' : 'Not recorded in the app yet')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.planDoneBtn, { borderColor: colors.primary }]}
                    onPress={() => navigation.navigate('AddMaintenance', { id: car.id, planOperacion: item.operacion })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.planDoneText, { color: colors.primary }]}>
                      {language === 'es' ? '✓ Registrar como hecho' : '✓ Mark as done'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity
              style={[styles.planBtn, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate('MaintenancePlan', { marca: car.brand, modelo: car.model, version: car.version })}
            >
              <Text style={[styles.planBtnText, { color: colors.primary }]}>
                {language === 'es' ? 'Ver plan completo' : 'View full plan'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Ficha técnica */}
      <TouchableOpacity
        style={[styles.assistantBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CarAssistant', {
          carId: car.id,
          carName: `${car.brand} ${car.model}`,
        })}
        activeOpacity={0.85}
      >
        <Zap size={18} color={colors.onPrimary} />
        <Text style={[styles.assistantBtnText, { color: colors.onPrimary }]}>
          {language === 'es' ? 'Ficha técnica del vehículo' : 'Vehicle specs'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroBrand: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  heroPlate: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, opacity: 0.8 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: { height: 1, marginHorizontal: 16 },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '600' },
  kmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kmLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kmValue: { fontSize: 18, fontWeight: '800' },
  updateButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex1: { flex: 1 },
  maintenanceSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { paddingVertical: 8, paddingHorizontal: 14 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  planCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  planOpName: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  planBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeText: { fontSize: 11, fontWeight: '700' },
  planDetail: { fontSize: 12, lineHeight: 18 },
  planBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  planBtnText: { fontSize: 14, fontWeight: '700' },
  planDoneBtn: {
    alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1,
  },
  planDoneText: { fontSize: 12, fontWeight: '700' },
  assistantBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8, marginBottom: 24,
    paddingVertical: 14, borderRadius: 14,
  },
  assistantBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CarDetailsScreen;
