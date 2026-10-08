import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCircle } from 'lucide-react-native';
import { requestService } from '../services/api';
import InputField from '../components/InputField';
import ButtonPrimary from '../components/ButtonPrimary';
import { SettingsContext } from '../context/SettingsContext';

const EditProfileScreen = () => {
  const { colors, language } = useContext(SettingsContext);

  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const t = {
    title:      language === 'es' ? 'Mi Perfil'                              : 'My Profile',
    subtitle:   language === 'es'
      ? 'Los cambios los revisa un gestor antes de aplicarse'
      : 'Changes are reviewed by a manager before they apply',
    nameLabel:  language === 'es' ? 'Nombre completo'                        : 'Full name',
    emailLabel: language === 'es' ? 'Correo electrónico'                     : 'Email address',
    save:       language === 'es' ? 'Guardar cambios'                        : 'Save changes',
    saving:     language === 'es' ? 'Enviando...'                            : 'Sending...',
    noChanges:  language === 'es' ? 'No hay cambios que enviar'              : 'No changes to send',
    sentTitle:  language === 'es' ? 'Solicitud enviada'                      : 'Request sent',
    sentMsg:    language === 'es'
      ? 'Tu cambio quedó pendiente de aprobación de un gestor. Se aplicará cuando lo revisen.'
      : 'Your change is pending manager approval. It will apply once reviewed.',
    errorTitle: language === 'es' ? 'Error'                                  : 'Error',
    fillFields: language === 'es' ? 'El nombre y el correo no pueden quedar vacíos' : 'Name and email cannot be empty',
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setOriginalName(parsed.name || '');
        setOriginalEmail(parsed.email || '');
        setName(parsed.name || '');
        setEmail(parsed.email || '');
      }
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t.errorTitle, t.fillFields);
      return;
    }

    const changes = [];
    if (name.trim() !== originalName) changes.push({ field: 'name', new_value: name.trim() });
    if (email.trim() !== originalEmail) changes.push({ field: 'email', new_value: email.trim() });

    if (changes.length === 0) {
      Alert.alert(t.errorTitle, t.noChanges);
      return;
    }

    setSaving(true);
    try {
      // Un pedido por campo: el backend valida un `field` a la vez por request.
      for (const change of changes) {
        await requestService.create('edit_user_data', change);
      }
      Alert.alert(t.sentTitle, t.sentMsg);
      // No revertimos los inputs: quedan mostrando el valor pedido, aunque
      // todavía no esté aprobado (mismo criterio que el resto de la app,
      // que no intenta reflejar el estado "pending" en la UI).
      setOriginalName(name.trim());
      setOriginalEmail(email.trim());
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      Alert.alert(t.errorTitle, msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
          <UserCircle size={32} color={colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InputField
          label={t.nameLabel}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <InputField
          label={t.emailLabel}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <ButtonPrimary onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? t.saving : t.save}
        </ButtonPrimary>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
  },
  iconContainer: { padding: 12, borderRadius: 12 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  saveButton: { marginTop: 8 },
});

export default EditProfileScreen;
