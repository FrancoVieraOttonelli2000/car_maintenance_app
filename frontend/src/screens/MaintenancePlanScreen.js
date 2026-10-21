import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, ScrollView, TextInput, TouchableOpacity
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { maintenancePlanService, carService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsContext } from '../context/SettingsContext';
import { Car } from 'lucide-react-native';

const toDisplay = (km, unit) => unit === 'mi' ? Math.round(km * 0.621371) : km;
const toKm = (val, unit) => unit === 'mi' ? Math.round(val / 0.621371) : val;

export default function MaintenancePlanScreen({ route }) {
  const { colors, unit } = useContext(SettingsContext);
  const { marca: paramMarca, modelo: paramModelo, version: paramVersion } = route?.params || {};

  // Coches del usuario
  const [misCochesList, setMisCochesList] = useState([]);

  // Pickers
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [versiones, setVersiones] = useState([]);
  const [plan, setPlan] = useState([]);

  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  const [kmActual, setKmActual] = useState('');
  const [fechaUltimoServicio, setFechaUltimoServicio] = useState('');
  const [alertas, setAlertas] = useState([]);
  const [modoAlertas, setModoAlertas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Acepta DD/MM/YYYY o YYYY-MM-DD; devuelve YYYY-MM-DD o null si formato inválido
  const parseFecha = (str) => {
    if (!str.trim()) return '';
    const ddmmyyyy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return null;
  };

  useEffect(() => {
    maintenancePlanService.getMarcas().then(r => setMarcas(r.data)).catch(console.error);
    AsyncStorage.getItem('user').then(raw => {
      if (!raw) return;
      const user = JSON.parse(raw);
      carService.getUserCars(user.id)
        .then(r => setMisCochesList(r.data || []))
        .catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!paramMarca) return;
    const loadFromParams = async () => {
      setSelectedMarca(paramMarca);
      try {
        const rm = await maintenancePlanService.getModelos(paramMarca);
        setModelos(rm.data);
        if (paramModelo) {
          setSelectedModelo(paramModelo);
          const rv = await maintenancePlanService.getVersiones(paramMarca, paramModelo);
          setVersiones(rv.data);
          if (paramVersion) {
            setSelectedVersion(paramVersion);
            await cargarPlan(paramMarca, paramModelo, paramVersion);
          }
        }
      } catch (e) { console.error(e); }
    };
    loadFromParams();
  }, [paramMarca, paramModelo, paramVersion]);

  const cargarPlan = async (marca, modelo, version) => {
    if (!version) return;
    setLoading(true);
    setPlan([]);
    setAlertas([]);
    setModoAlertas(false);
    setError('');
    try {
      const r = await maintenancePlanService.getPlan(marca, modelo, version);
      setPlan(r.data);
    } catch { setError('Error al cargar el plan. Comprueba la conexión.'); }
    finally { setLoading(false); }
  };

  const seleccionarCoche = async (coche) => {
    const marca   = coche.brand;
    const modelo  = coche.model;
    const version = coche.version;

    setSelectedMarca(marca);
    setSelectedModelo(modelo);
    setSelectedVersion(version || '');
    setKmActual(String(toDisplay(coche.current_km || 0, unit)));
    setFechaUltimoServicio('');

    // Cargar listas encadenadas para que los pickers queden coherentes
    try {
      const rm = await maintenancePlanService.getModelos(marca);
      setModelos(rm.data);
    } catch {}
    if (modelo) {
      try {
        const rv = await maintenancePlanService.getVersiones(marca, modelo);
        setVersiones(rv.data);
      } catch {}
    }

    if (version) {
      await cargarPlan(marca, modelo, version);
    } else {
      setError('Este coche no tiene versión guardada. Selecciónala manualmente.');
      setPlan([]);
    }
  };

  const onMarcaChange = async (marca) => {
    setSelectedMarca(marca);
    setSelectedModelo('');
    setSelectedVersion('');
    setPlan([]);
    setAlertas([]);
    setModoAlertas(false);
    setError('');
    if (marca) {
      try {
        const r = await maintenancePlanService.getModelos(marca);
        setModelos(r.data);
      } catch { setError('Error al cargar los modelos.'); }
    }
  };

  const onModeloChange = async (modelo) => {
    setSelectedModelo(modelo);
    setSelectedVersion('');
    setPlan([]);
    setAlertas([]);
    setModoAlertas(false);
    setError('');
    if (modelo) {
      try {
        const r = await maintenancePlanService.getVersiones(selectedMarca, modelo);
        setVersiones(r.data);
      } catch { setError('Error al cargar las versiones.'); }
    }
  };

  const onVersionChange = async (version) => {
    setSelectedVersion(version);
    setModoAlertas(false);
    setError('');
    if (version) await cargarPlan(selectedMarca, selectedModelo, version);
  };

  const calcularAlertas = async () => {
    if (!selectedVersion || !kmActual) return;

    const fechaISO = parseFecha(fechaUltimoServicio);
    if (fechaISO === null) {
      setError('Formato de fecha incorrecto. Usa DD/MM/YYYY o YYYY-MM-DD.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const r = await maintenancePlanService.getAlertas(
        selectedMarca, selectedModelo, selectedVersion, toKm(parseInt(kmActual), unit), fechaISO
      );
      setAlertas(r.data);
      setModoAlertas(true);
    } catch { setError('Error al calcular alertas. Comprueba la conexión con el servidor.'); }
    finally { setLoading(false); }
  };

  const getBadgeStyle = (item) => {
    if (!item.alerta) return styles.badgeVerde;
    if (item.vencido || (item.kmRestantes !== null && item.kmRestantes <= 500) || (item.diasRestantes !== null && item.diasRestantes <= 7)) return styles.badgeRojo;
    return styles.badgeNaranja;
  };

  const getBadgeText = (item) => {
    if (!item.alerta) return '✓ OK';
    if (item.vencido) return '⚠ VENCIDO';
    if ((item.kmRestantes !== null && item.kmRestantes <= 500) || (item.diasRestantes !== null && item.diasRestantes <= 7)) return '⚠ URGENTE';
    return '! Próximo';
  };

  const datos = modoAlertas ? alertas : plan;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Mis coches ── */}
      {misCochesList.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis coches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cocheScroll}>
            {misCochesList.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => seleccionarCoche(c)}
                style={[
                  styles.cocheChip,
                  {
                    backgroundColor:
                      selectedMarca === c.brand && selectedModelo === c.model
                        ? colors.primary
                        : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Car
                  size={14}
                  color={
                    selectedMarca === c.brand && selectedModelo === c.model
                      ? colors.onPrimary
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.cocheChipText,
                    {
                      color:
                        selectedMarca === c.brand && selectedModelo === c.model
                          ? colors.onPrimary
                          : colors.text,
                    },
                  ]}
                >
                  {c.brand} {c.model}
                </Text>
                <Text
                  style={[
                    styles.cocheChipPlate,
                    {
                      color:
                        selectedMarca === c.brand && selectedModelo === c.model
                          ? 'rgba(255,255,255,0.75)'
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {c.plate}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[styles.separador, { backgroundColor: colors.border }]} />
        </>
      )}

      {/* ── Pickers manuales ── */}
      <Text style={[styles.label, { color: colors.text }]}>Marca</Text>
      <View style={[styles.pickerWrapper, { borderColor: colors.border || '#ccc' }]}>
        <Picker selectedValue={selectedMarca} onValueChange={onMarcaChange} style={{ color: colors.text }}>
          <Picker.Item label="Selecciona marca..." value="" />
          {marcas.map(m => <Picker.Item key={m} label={m} value={m} />)}
        </Picker>
      </View>

      {modelos.length > 0 && <>
        <Text style={[styles.label, { color: colors.text }]}>Modelo</Text>
        <View style={[styles.pickerWrapper, { borderColor: colors.border || '#ccc' }]}>
          <Picker selectedValue={selectedModelo} onValueChange={onModeloChange} style={{ color: colors.text }}>
            <Picker.Item label="Selecciona modelo..." value="" />
            {modelos.map(m => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
        </View>
      </>}

      {versiones.length > 0 && <>
        <Text style={[styles.label, { color: colors.text }]}>Versión / Motorización</Text>
        <View style={[styles.pickerWrapper, { borderColor: colors.border || '#ccc' }]}>
          <Picker selectedValue={selectedVersion} onValueChange={onVersionChange} style={{ color: colors.text }}>
            <Picker.Item label="Selecciona versión..." value="" />
            {versiones.map(v => <Picker.Item key={v} label={v} value={v} />)}
          </Picker>
        </View>
      </>}

      {plan.length > 0 && <>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Calcular alertas</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border || '#ccc' }]}
          placeholder="Km actuales (ej: 85000)"
          placeholderTextColor={colors.subtext || '#999'}
          keyboardType="numeric"
          value={kmActual}
          onChangeText={setKmActual}
        />
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border || '#ccc' }]}
          placeholder="Fecha del último servicio (DD/MM/YYYY)"
          placeholderTextColor={colors.subtext || '#999'}
          value={fechaUltimoServicio}
          onChangeText={(v) => { setFechaUltimoServicio(v); setError(''); }}
        />
        {error !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.boton} onPress={calcularAlertas}>
          <Text style={styles.botonText}>Calcular alertas</Text>
        </TouchableOpacity>
        {modoAlertas && (
          <TouchableOpacity style={[styles.boton, { backgroundColor: '#555' }]} onPress={() => setModoAlertas(false)}>
            <Text style={styles.botonText}>Ver plan completo</Text>
          </TouchableOpacity>
        )}
      </>}

      {error !== '' && plan.length === 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#E53935" style={{ marginTop: 20 }} />}

      <FlatList
        data={datos}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card || '#1e1e1e' }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.operacion, { color: colors.text }]}>{item.operacion}</Text>
              {modoAlertas && <Text style={[styles.badge, getBadgeStyle(item)]}>{getBadgeText(item)}</Text>}
            </View>
            <View style={styles.chips}>
              {item.cada_km && <Text style={styles.chip}>Cada {toDisplay(item.cada_km, unit).toLocaleString()} {unit.toUpperCase()}</Text>}
              {item.cada_meses && <Text style={styles.chip}>Cada {item.cada_meses} meses</Text>}
            </View>
            {modoAlertas && item.kmRestantes !== null && (
              <Text style={[styles.detalle, { color: colors.subtext || '#aaa' }]}>
                {item.vencido
                  ? `Llevas ${toDisplay(-item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()} de retraso (debía tocar a los ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()})`
                  : `Próximo a los ${toDisplay(item.proximoKm, unit)?.toLocaleString()} ${unit.toUpperCase()} (${toDisplay(item.kmRestantes, unit)?.toLocaleString()} ${unit.toUpperCase()} restantes)`}
              </Text>
            )}
            {modoAlertas && item.proximaFecha && (
              <Text style={[styles.detalle, { color: colors.subtext || '#aaa' }]}>
                {item.diasRestantes <= 0
                  ? `Vencido desde: ${item.proximaFecha} (hace ${-item.diasRestantes} días)`
                  : `Fecha límite: ${item.proximaFecha} (${item.diasRestantes} días)`}
              </Text>
            )}
            {item.notas ? <Text style={[styles.notas, { color: colors.subtext || '#aaa' }]}>{item.notas}</Text> : null}
          </View>
        )}
      />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginTop: 8, marginBottom: 8 },
  label: { fontWeight: 'bold', fontSize: 14, marginTop: 16, marginBottom: 4 },
  cocheScroll: { marginBottom: 8 },
  cocheChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  cocheChipText: { fontSize: 13, fontWeight: '700' },
  cocheChipPlate: { fontSize: 11, fontWeight: '500' },
  separador: { height: 1, marginVertical: 16 },
  pickerWrapper: { borderWidth: 1, borderRadius: 8, marginBottom: 4, overflow: 'hidden' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14 },
  errorBox: { backgroundColor: '#FFCDD2', borderRadius: 8, padding: 12, marginBottom: 8 },
  errorText: { color: '#B71C1C', fontWeight: '600', fontSize: 13 },
  boton: { backgroundColor: '#E53935', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  botonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: { borderRadius: 10, padding: 14, marginVertical: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  operacion: { fontWeight: '600', fontSize: 15, flex: 1, marginRight: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: 'bold', overflow: 'hidden' },
  badgeVerde: { backgroundColor: '#C8E6C9', color: '#2E7D32' },
  badgeNaranja: { backgroundColor: '#FFE0B2', color: '#E65100' },
  badgeRojo: { backgroundColor: '#FFCDD2', color: '#B71C1C' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  chip: { backgroundColor: '#E3F2FD', color: '#1565C0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, fontSize: 12 },
  detalle: { fontSize: 12, marginTop: 2 },
  notas: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
});
