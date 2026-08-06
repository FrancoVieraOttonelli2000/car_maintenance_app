import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Droplets, Flame, Leaf } from 'lucide-react-native';

const FUEL_CONFIG = {
  electric: { labelEs: 'Eléctrico', labelEn: 'Electric', color: '#16a34a', bg: '#dcfce7', Icon: Zap },
  diesel:   { labelEs: 'Diésel',    labelEn: 'Diesel',   color: '#475569', bg: '#e2e8f0', Icon: Droplets },
  gasoline: { labelEs: 'Gasolina',  labelEn: 'Gasoline', color: '#ea580c', bg: '#fff7ed', Icon: Flame },
  hybrid:   { labelEs: 'Híbrido',   labelEn: 'Hybrid',   color: '#2563eb', bg: '#eff6ff', Icon: Leaf },
};

function detectFuelKey(fuel) {
  if (!fuel) return null;
  const f = fuel.toLowerCase();
  if (f.includes('electr'))                                                        return 'electric';
  if (f.includes('diesel') || f.includes('diésel'))                               return 'diesel';
  if (f.includes('hybrid') || f.includes('híbrido') || f.includes('hibrido'))     return 'hybrid';
  if (f.includes('gasol') || f.includes('petrol') || f.includes('gasolina') || f.includes('benzin')) return 'gasoline';
  return null;
}

const FuelBadge = ({ fuel, language = 'es', size = 'md' }) => {
  const key = detectFuelKey(fuel);
  if (!key) return (
    <Text style={styles.fallback}>{fuel}</Text>
  );

  const { labelEs, labelEn, color, bg, Icon } = FUEL_CONFIG[key];
  const label = language === 'es' ? labelEs : labelEn;
  const iconSize = size === 'sm' ? 12 : 14;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '55' }]}>
      <Icon size={iconSize} color={color} />
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
  fallback: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FuelBadge;
