import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { managerService } from '../services/api';
import { Users, ShieldCheck } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const ManagerUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotingId, setPromotingId] = useState(null);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:       language === 'es' ? 'Usuarios'                                : 'Users',
    subtitle:    language === 'es' ? 'Consultá usuarios y promové gestores'    : 'View users and promote managers',
    manager:     language === 'es' ? 'Gestor'                                  : 'Manager',
    client:      language === 'es' ? 'Cliente'                                 : 'Client',
    promote:     language === 'es' ? 'Promover a gestor'                       : 'Promote to manager',
    confirmTitle:language === 'es' ? 'Confirmar'                               : 'Confirm',
    confirmMsg:  (email) => language === 'es'
      ? `¿Convertir a ${email} en gestor? Va a poder aprobar solicitudes y promover a otros usuarios.`
      : `Make ${email} a manager? They'll be able to approve requests and promote other users.`,
    cancel:      language === 'es' ? 'Cancelar'                                : 'Cancel',
    confirm:     language === 'es' ? 'Confirmar'                               : 'Confirm',
    errorTitle:  language === 'es' ? 'Error'                                   : 'Error',
    emptyTitle:  language === 'es' ? 'Sin usuarios'                            : 'No users',
    emptyText:   language === 'es' ? 'No hay usuarios registrados.'            : 'No registered users.',
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      const response = await managerService.listUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const promote = async (user) => {
    setPromotingId(user.id);
    try {
      await managerService.promote(user.email);
      fetchUsers();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      Alert.alert(t.errorTitle, msg);
    } finally {
      setPromotingId(null);
    }
  };

  const confirmPromote = (user) => {
    Alert.alert(t.confirmTitle, t.confirmMsg(user.email), [
      { text: t.cancel, style: 'cancel' },
      { text: t.confirm, onPress: () => promote(user) },
    ]);
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.emptyTitle}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.emptyText}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(100,116,139,0.1)' }]}>
          <Users size={32} color={colors.textSecondary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardText}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
            </View>
            {item.role === 'manager' ? (
              <View style={[styles.roleBadge, { backgroundColor: 'rgba(212,175,55,0.12)' }]}>
                <ShieldCheck size={14} color="#eab308" />
                <Text style={[styles.roleText, { color: '#eab308' }]}>{t.manager}</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => confirmPromote(item)}
                disabled={promotingId === item.id}
                style={[styles.promoteBtn, { borderColor: colors.primary, opacity: promotingId === item.id ? 0.5 : 1 }]}
              >
                <Text style={[styles.promoteText, { color: colors.primary }]}>{t.promote}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
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
  subtitle: { fontSize: 14, marginTop: 4 },
  listContainer: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
  email: { fontSize: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  roleText: { fontSize: 12, fontWeight: '700' },
  promoteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  promoteText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { textAlign: 'center', lineHeight: 22 },
});

export default ManagerUsersScreen;
