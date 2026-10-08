import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, TextInput, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { maintenanceService } from '../services/api';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { SettingsContext } from '../context/SettingsContext';

const FALLBACK_TYPES = [
  { id: 1, name: 'Cambio de Aceite',       name_en: 'Oil Change'       },
  { id: 2, name: 'Rotación de Neumáticos', name_en: 'Tire Rotation'    },
  { id: 3, name: 'Inspección de Frenos',   name_en: 'Brake Inspection' },
  { id: 4, name: 'Filtro de Aire',         name_en: 'Air Filter'       },
  { id: 5, name: 'Revisión Completa',      name_en: 'Full Service'     },
];

const TYPE_EN = {
  'Cambio de Aceite':       'Oil Change',
  'Rotación de Neumáticos': 'Tire Rotation',
  'Inspección de Frenos':   'Brake Inspection',
  'Filtro de Aire':         'Air Filter',
  'Revisión Completa':      'Full Service',
};

const toKm = (val, unit) => unit === 'mi' ? Math.round(val / 0.621371) : val;

const AddMaintenanceScreen = ({ route, navigation }) => {
  // planOperacion llega cuando se pulsa "Registrar como hecho" en una
  // operación del plan de fábrica (CarDetailsScreen). En ese caso el registro
  // se guarda vinculado a esa operación y su aviso deja de salir.
  const { id, planOperacion } = route.params;
  const { colors, language, unit } = useContext(SettingsContext);

  const [maintenanceTypes, setMaintenanceTypes] = useState(FALLBACK_TYPES);
  const [formData, setFormData] = useState({
    type_id: '1',
    km: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    workshop: '',
    own_breakdown: false,
  });
  const [loading, setLoading] = useState(false);

  const t = {
    title:          language === 'es' ? 'Registrar Servicio'                    : 'Record Service',
    type:           language === 'es' ? 'Tipo de Servicio *'                    : 'Service Type *',
    mileage:        language === 'es' ? `Kilometraje (${unit.toUpperCase()}) *` : `Mileage (${unit.toUpperCase()}) *`,
    date:           language === 'es' ? 'Fecha *'                               : 'Date *',
    workshop:       language === 'es' ? 'Taller'                                : 'Workshop',
    workshopPh:     language === 'es' ? 'Nombre del taller'                     : 'Workshop name',
    ownBreakdown:   language === 'es' ? 'Avería detectada por el cliente'       : 'Breakdown detected by client',
    notes:          language === 'es' ? 'Notas (opcional)'                      : 'Notes (optional)',
    notesPh:        language === 'es' ? 'Ej. Cambio de filtro también.'         : 'E.g. Changed oil filter as well.',
    save:           language === 'es' ? 'Guardar Registro'                      : 'Save Record',
    saving:         language === 'es' ? 'Guardando...'                          : 'Saving...',
    errorFill:      language === 'es' ? 'Por favor, rellena Tipo, KM y Fecha.'   : 'Please fill in Type, KM and Date.',
    errorSave:      language === 'es' ? 'Error al guardar el registro.'         : 'Failed to save record.',
  };

  useEffect(() => {
    maintenanceService.getTypes()
      .then(res => { if (res.data?.length) setMaintenanceTypes(res.data); })
      .catch(() => {});
  }, []);

  const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if ((!planOperacion && !formData.type_id) || !formData.km || !formData.date) {
      Alert.alert('Error', t.errorFill);
      return;
    }
    setLoading(true);
    try {
      const kmValue = parseInt(formData.km, 10);
      if (Number.isNaN(kmValue) || kmValue < 0) {
        Alert.alert('Error', t.errorFill);
        setLoading(false);
        return;
      }
      await maintenanceService.createMaintenance({
        car_id: id,
        km: toKm(kmValue, unit),
        date: formData.date,
        notes: formData.notes,
        workshop: formData.workshop,
        own_breakdown: formData.own_breakdown,
        ...(planOperacion
          ? { plan_operacion: planOperacion }
          : { type_id: parseInt(formData.type_id, 10) }),
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add maintenance', error?.message);
      Alert.alert('Error', error?.response?.data?.error || t.errorSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>

          {/* Tipo de servicio — Picker */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.type}</Text>
          {planOperacion ? (
          <View style={[styles.planOpBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.planOpText, { color: colors.inputText }]}>{planOperacion}</Text>
            <Text style={[styles.planOpHint, { color: colors.textSecondary }]}>
              {language === 'es' ? 'Operación del plan de fábrica' : 'Factory plan operation'}
            </Text>
          </View>
          ) : (
          <View style={[styles.pickerWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Picker
              selectedValue={formData.type_id}
              onValueChange={val => handleChange('type_id', val)}
              style={{ color: colors.inputText }}
              dropdownIconColor={colors.textSecondary}
            >
              {maintenanceTypes.map(type => (
                <Picker.Item
                  key={type.id}
                  label={language === 'es' ? type.name : (TYPE_EN[type.name] || type.name_en || type.name)}
                  value={String(type.id)}
                  color={colors.inputText}
                />
              ))}
            </Picker>
          </View>
          )}

          {/* KM y Fecha */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <InputField
                label={t.mileage}
                value={formData.km}
                onChangeText={v => handleChange('km', v)}
                placeholder="45500"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.flex1}>
              <InputField
                label={t.date}
                value={formData.date}
                onChangeText={v => handleChange('date', v)}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          {/* Taller */}
          <InputField
            label={t.workshop}
            value={formData.workshop}
            onChangeText={v => handleChange('workshop', v)}
            placeholder={t.workshopPh}
          />

          {/* Avería propia */}
          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t.ownBreakdown}</Text>
            <Switch
              value={formData.own_breakdown}
              onValueChange={v => handleChange('own_breakdown', v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Notas */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.notes}</Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            }]}
            value={formData.notes}
            onChangeText={v => handleChange('notes', v)}
            placeholder={t.notesPh}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <ButtonPrimary onPress={handleSubmit} disabled={loading} style={styles.submitButton}>
            {loading ? t.saving : t.save}
          </ButtonPrimary>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  pickerWrap: {
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  planOpBox: { borderWidth: 1.5, borderRadius: 10, padding: 14, marginBottom: 16 },
  planOpText: { fontSize: 15, fontWeight: '700' },
  planOpHint: { fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  spacer: { width: 14 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 16,
  },
  switchLabel: { fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 12 },
  textArea: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    marginBottom: 20,
  },
  submitButton: { paddingVertical: 15 },
});

export default AddMaintenanceScreen;
