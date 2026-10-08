import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Car } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';
import FuelBadge from './FuelBadge';

const toDisplay = (km, unit) => unit === 'mi' ? Math.round(km * 0.621371) : km;

const CarCard = ({ car }) => {
  const { colors, language, unit } = useContext(SettingsContext);

  return (
    <View style={[styles.card, {
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: colors.shadow,
    }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>
          <Car size={22} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{car.brand} {car.model}</Text>
          <Text style={[styles.plate, { color: colors.primary }]}>{car.plate}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'AÑO' : 'YEAR'}
          </Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{car.year}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'MOTOR' : 'ENGINE'}
          </Text>
          <Text style={[styles.gridValue, { color: colors.text }]}>{car.engine}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? 'COMBUSTIBLE' : 'FUEL'}
          </Text>
          <FuelBadge fuel={car.fuel} language={language} size="sm" />
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>
            {language === 'es' ? (unit === 'km' ? 'KILOMETRAJE' : 'MILLAS') : 'MILEAGE'}
          </Text>
          <Text style={[styles.gridValue, { color: colors.primary, fontWeight: '700' }]}>
            {toDisplay(car.current_km, unit)?.toLocaleString()} {unit.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  plate: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%', gap: 2 },
  gridLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  gridValue: { fontSize: 14, fontWeight: '500' },
});

export default CarCard;
