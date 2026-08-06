import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SettingsContext } from '../context/SettingsContext';
import api from '../services/api';
import { Droplets, Disc3, Snowflake, Wrench, AlertCircle } from 'lucide-react-native';

const Row = ({ label, value, colors }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const Card = ({ icon: Icon, color, bg, title, children, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
    </View>
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
    {children}
  </View>
);

export default function CarAssistantScreen({ route }) {
  const { carId, carName } = route.params;
  const { colors, language } = useContext(SettingsContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/car-fluids/${carId}`)
      .then(r => {
        if (!r.data.fluids) setNotFound(true);
        else setData(r.data.fluids);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [carId]);

  const t = (es, en) => language === 'es' ? es : en;

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (notFound) return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.notFoundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AlertCircle size={40} color={colors.textSecondary} />
        <Text style={[styles.notFoundTitle, { color: colors.text }]}>
          {t('Vehículo no encontrado en la base de datos', 'Vehicle not found in database')}
        </Text>
        <Text style={[styles.notFoundSub, { color: colors.textSecondary }]}>
          {t(
            'Consulta el manual de tu vehículo o pregunta en tu taller de confianza.',
            'Check your vehicle manual or ask at your trusted garage.'
          )}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{carName}</Text>

      {/* Aceite */}
      <Card icon={Droplets} color="#f59e0b" bg="rgba(245,158,11,0.12)"
        title={t('Aceite de motor', 'Engine oil')} colors={colors}>
        <Row label={t('Viscosidad', 'Viscosity')}   value={data.oil_viscosity} colors={colors} />
        <Row label={t('Tipo', 'Type')}              value={data.oil_type}      colors={colors} />
        <Row label={t('Especificación', 'Spec')}    value={data.oil_spec}      colors={colors} />
        {data.oil_motul && (
          <View style={[styles.motulBadge, { backgroundColor: 'rgba(245,158,11,0.10)' }]}>
            <Text style={[styles.motulText, { color: '#f59e0b' }]}>
              Motul: {data.oil_motul}
            </Text>
          </View>
        )}
      </Card>

      {/* Líquido de frenos */}
      <Card icon={Disc3} color="#ef4444" bg="rgba(239,68,68,0.12)"
        title={t('Líquido de frenos', 'Brake fluid')} colors={colors}>
        <Row label={t('Tipo', 'Type')} value={data.brake_fluid} colors={colors} />
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          {t(
            'Cambio recomendado cada 2 años independientemente del kilometraje.',
            'Recommended change every 2 years regardless of mileage.'
          )}
        </Text>
      </Card>

      {/* Anticongelante */}
      <Card icon={Snowflake} color="#3b82f6" bg="rgba(59,130,246,0.12)"
        title={t('Anticongelante', 'Coolant')} colors={colors}>
        <Row label={t('Tipo / Color', 'Type / Color')} value={data.coolant_type} colors={colors} />
        <Row label={t('Dilución', 'Mix ratio')}        value={data.coolant_mix}  colors={colors} />
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          {t(
            '⚠ No mezcles tipos distintos de anticongelante.',
            '⚠ Do not mix different coolant types.'
          )}
        </Text>
      </Card>

      {/* Pastillas y discos */}
      <Card icon={Wrench} color="#8b5cf6" bg="rgba(139,92,246,0.12)"
        title={t('Pastillas y discos', 'Brake pads & discs')} colors={colors}>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          {t(
            'Las medidas varían según versión y paquete de frenos. Busca por VIN o matrícula en tu taller o en la web de SDT para obtener la referencia exacta de tu vehículo.',
            'Sizes vary by version and brake package. Search by VIN or plate at your garage or the SDT website for the exact reference for your vehicle.'
          )}
        </Text>
        <View style={[styles.motulBadge, { backgroundColor: 'rgba(139,92,246,0.10)' }]}>
          <Text style={[styles.motulText, { color: '#8b5cf6' }]}>
            {t('Proveedor recomendado: SDT Frenos', 'Recommended supplier: SDT Frenos')}
          </Text>
        </View>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  card: {
    borderRadius: 16, borderWidth: 1,
    marginBottom: 14, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  divider: { height: 1, marginHorizontal: 14 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 14,
    paddingVertical: 10, gap: 8,
  },
  rowLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '700', flex: 2, textAlign: 'right' },
  note: { fontSize: 12, lineHeight: 18, paddingHorizontal: 14, paddingVertical: 8 },
  motulBadge: {
    marginHorizontal: 14, marginBottom: 12, marginTop: 2,
    borderRadius: 8, padding: 10,
  },
  motulText: { fontSize: 12, fontWeight: '700' },
  notFoundCard: {
    borderRadius: 16, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 12, marginTop: 40,
  },
  notFoundTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  notFoundSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
