import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SettingsContext } from '../context/SettingsContext';

const AlertCard = ({ alert }) => {
  const navigation = useNavigation();
  const { colors, language } = useContext(SettingsContext);

  const btnText = language === 'es' ? 'Registrar servicio' : 'Record Service';
  const alertMessage = language === 'es'
    ? `Toca revisar: ${alert.type_name}. Llevas ${alert.overdue_km} km de retraso.`
    : `Time for ${alert.type_name}. Overdue by ${alert.overdue_km} km.`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AddMaintenance', { id: alert.car_id })}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.accentBar, { backgroundColor: colors.danger }]} />

      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(220,38,38,0.08)' }]}>
          <Bell size={20} color={colors.danger} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.type, { color: colors.text }]}>{alert.type_name}</Text>
          <Text style={[styles.car, { color: colors.textSecondary }]}>{alert.car_name}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {alertMessage}
          </Text>
        </View>

        <View style={styles.action}>
          <Text style={[styles.actionText, { color: colors.danger }]}>{btnText}</Text>
          <ChevronRight size={16} color={colors.danger} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingLeft: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: { flex: 1, gap: 2 },
  type: { fontSize: 14, fontWeight: '700' },
  car: { fontSize: 12, fontWeight: '500' },
  message: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

export default AlertCard;
