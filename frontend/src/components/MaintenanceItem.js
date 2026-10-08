import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const MaintenanceItem = ({ maintenance }) => {
  const { colors, language } = useContext(SettingsContext);

  const atLabel = language === 'es' ? 'A los ' : 'At ';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
        <CheckCircle2 size={20} color="#16a34a" />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {maintenance.tipo_de_mantenimiento}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date(maintenance.fecha).toLocaleDateString()}
          </Text>
        </View>

        <Text style={[styles.km, { color: colors.textSecondary }]}>
          {atLabel}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            {maintenance.km?.toLocaleString()} km
          </Text>
        </Text>

        {maintenance.notas ? (
          <View style={[styles.notesContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.notes, { color: colors.textSecondary }]}>"{maintenance.notas}"</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  date: { fontSize: 12, fontWeight: '500' },
  km: { fontSize: 13, marginBottom: 6 },
  notesContainer: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  notes: { fontSize: 13, fontStyle: 'italic' },
});

export default MaintenanceItem;
