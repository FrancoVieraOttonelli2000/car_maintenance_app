import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { carService, maintenancePlanService } from '../services/api';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { SettingsContext } from '../context/SettingsContext';

const FUEL_OPTIONS = [
  { value: 'Gasoline', labelEs: 'Gasolina',  labelEn: 'Gasoline' },
  { value: 'Diesel',   labelEs: 'Diésel',    labelEn: 'Diesel'   },
  { value: 'Hybrid',   labelEs: 'Híbrido',   labelEn: 'Hybrid'   },
  { value: 'Electric', labelEs: 'Eléctrico', labelEn: 'Electric' },
];

const AddCarScreen = ({ navigation }) => {
  const { colors, language, unit } = useContext(SettingsContext);

  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [versiones, setVersiones] = useState([]);

  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  const [plate, setPlate]       = useState('');
  const [year, setYear]         = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [engine, setEngine]     = useState('');
  const [fuel, setFuel]         = useState('Gasoline');

  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingVersiones, setLoadingVersiones] = useState(false);
  const [saving, setSaving] = useState(false);

  const t = {
    title:        language === 'es' ? 'Añadir Vehículo'                                  : 'Add Vehicle',
    marca:        language === 'es' ? 'Marca *'                                           : 'Brand *',
    modelo:       language === 'es' ? 'Modelo *'                                          : 'Model *',
    version:      language === 'es' ? 'Versión *'                                         : 'Version *',
    selMarca:     language === 'es' ? 'Selecciona marca...'                               : 'Select brand...',
    selModelo:    language === 'es' ? 'Selecciona modelo...'                              : 'Select model...',
    selVersion:   language === 'es' ? 'Selecciona versión...'                             : 'Select version...',
    plate:        language === 'es' ? 'Matrícula *'                                       : 'License Plate *',
    year:         language === 'es' ? 'Año *'                                             : 'Year *',
    engine:       language === 'es' ? 'Motor'                                             : 'Engine',
    fuel:         language === 'es' ? 'Combustible *'                                     : 'Fuel *',
    km:           language === 'es' ? `${unit === 'km' ? 'Kilometraje' : 'Millas'} *`    : `Mileage (${unit.toUpperCase()}) *`,
    save:         language === 'es' ? 'Guardar Vehículo'                                  : 'Save Vehicle',
    saving:       language === 'es' ? 'Guardando...'                                      : 'Saving...',
    errorFields:  language === 'es' ? 'Por favor, rellena todos los campos obligatorios.' : 'Please fill in all required fields.',
    errorSave:    language === 'es' ? 'Error al guardar el vehículo.'                     : 'Failed to save vehicle.',
  };

  useEffect(() => {
    maintenancePlanService.getMarcas()
      .then(r => setMarcas(r.data))
      .catch(() => {})
      .finally(() => setLoadingMarcas(false));
  }, []);

  const onMarcaChange = async (marca) => {
    setSelectedMarca(marca);
    setSelectedModelo('');
    setSelectedVersion('');
    setModelos([]);
    setVersiones([]);
    setEngine('');
    if (!marca) return;
    setLoadingModelos(true);
    try {
      const r = await maintenancePlanService.getModelos(marca);
      setModelos(r.data);
    } catch {}
    finally { setLoadingModelos(false); }
  };

  const onModeloChange = async (modelo) => {
    setSelectedModelo(modelo);
    setSelectedVersion('');
    setVersiones([]);
    setEngine('');
    if (!modelo) return;
    setLoadingVersiones(true);
    try {
      const r = await maintenancePlanService.getVersiones(selectedMarca, modelo);
      setVersiones(r.data);
    } catch {}
    finally { setLoadingVersiones(false); }
  };

  const onVersionChange = async (version) => {
    setSelectedVersion(version);
    setEngine('');
    if (!version) return;
    try {
      const r = await maintenancePlanService.getMotorizacion(selectedMarca, selectedModelo, version);
      if (r.data?.motorizacion) setEngine(r.data.motorizacion);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedMarca || !selectedModelo || !selectedVersion || !plate || !year || !currentKm) {
      Alert.alert('Error', t.errorFields);
      return;
    }
    setSaving(true);
    try {
      // El dueño lo pone el servidor a partir del token.
      await carService.createCar({
        brand: selectedMarca,
        model: selectedModelo,
        version: selectedVersion,
        engine,
        plate,
        year: parseInt(year, 10),
        // Si la app está en millas, se guarda siempre en km.
        current_km: unit === 'mi' ? Math.round(parseInt(currentKm, 10) / 0.621371) : parseInt(currentKm, 10),
        fuel,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create car', error?.message);
      Alert.alert('Error', error?.response?.data?.error || t.errorSave);
    } finally {
      setSaving(false);
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

          {/* Marca */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t.marca}</Text>
          {loadingMarcas
            ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
            : (
              <View style={[styles.pickerWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Picker
                  selectedValue={selectedMarca}
                  onValueChange={onMarcaChange}
                  style={{ color: colors.inputText }}
                  dropdownIconColor={colors.textSecondary}
                >
                  <Picker.Item label={t.selMarca} value="" color={colors.inputText} />
                  {marcas.map(m => <Picker.Item key={m} label={m} value={m} color={colors.inputText} />)}
                </Picker>
              </View>
            )
          }

          {/* Modelo */}
          {selectedMarca !== '' && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.modelo}</Text>
              {loadingModelos
                ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
                : (
                  <View style={[styles.pickerWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <Picker
                      selectedValue={selectedModelo}
                      onValueChange={onModeloChange}
                      style={{ color: colors.inputText }}
                      dropdownIconColor={colors.textSecondary}
                    >
                      <Picker.Item label={t.selModelo} value="" color={colors.inputText} />
                      {modelos.map(m => <Picker.Item key={m} label={m} value={m} color={colors.inputText} />)}
                    </Picker>
                  </View>
                )
              }
            </>
          )}

          {/* Versión */}
          {selectedModelo !== '' && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.version}</Text>
              {loadingVersiones
                ? <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
                : (
                  <View style={[styles.pickerWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <Picker
                      selectedValue={selectedVersion}
                      onValueChange={onVersionChange}
                      style={{ color: colors.inputText }}
                      dropdownIconColor={colors.textSecondary}
                    >
                      <Picker.Item label={t.selVersion} value="" color={colors.inputText} />
                      {versiones.map(v => <Picker.Item key={v} label={v} value={v} color={colors.inputText} />)}
                    </Picker>
                  </View>
                )
              }
            </>
          )}

          {/* Resto de campos (solo cuando se ha seleccionado versión) */}
          {selectedVersion !== '' && (
            <>
              <InputField
                label={t.engine}
                value={engine}
                onChangeText={setEngine}
                placeholder="1.8L / 2.0 TDI"
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <InputField label={t.plate} value={plate} onChangeText={setPlate} placeholder="1234-ABC" />
                </View>
                <View style={styles.spacer} />
                <View style={styles.flex1}>
                  <InputField label={t.year} value={year} onChangeText={setYear} placeholder="2020" keyboardType="numeric" />
                </View>
              </View>

              <InputField
                label={t.km}
                value={currentKm}
                onChangeText={setCurrentKm}
                placeholder="45000"
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t.fuel}</Text>
              <View style={[styles.pickerWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Picker
                  selectedValue={fuel}
                  onValueChange={setFuel}
                  style={{ color: colors.inputText }}
                  dropdownIconColor={colors.textSecondary}
                >
                  {FUEL_OPTIONS.map(opt => (
                    <Picker.Item
                      key={opt.value}
                      label={language === 'es' ? opt.labelEs : opt.labelEn}
                      value={opt.value}
                      color={colors.inputText}
                    />
                  ))}
                </Picker>
              </View>

              <ButtonPrimary onPress={handleSubmit} disabled={saving} style={styles.submitButton}>
                {saving ? t.saving : t.save}
              </ButtonPrimary>
            </>
          )}
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
  pickerWrap: { borderWidth: 1.5, borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  spacer: { width: 14 },
  submitButton: { marginTop: 8, paddingVertical: 15 },
});

export default AddCarScreen;
