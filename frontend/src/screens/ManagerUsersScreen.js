import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { managerService } from '../services/api';
import { Users, ShieldCheck, Trash2 } from 'lucide-react-native';
import { confirmAction, showMessage } from '../utils/dialogs';
import { SettingsContext } from '../context/SettingsContext';

const ManagerUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotingId, setPromotingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:       language === 'es' ? 'Usuarios'                                : 'Users',
    subtitle:    language === 'es' ? 'Consulta, promueve o elimina usuarios'   : 'View, promote or delete users',
    you:         language === 'es' ? 'Tú'                                      : 'You',
    manager:     language === 'es' ? 'Gestor'                                  : 'Manager',
    client:      language === 'es' ? 'Cliente'                                 : 'Client',
    promote:     language === 'es' ? 'Promover a gestor'                       : 'Promote to manager',
    confirmTitle:language === 'es' ? 'Confirmar'                               : 'Confirm',
    confirmMsg:  (email) => language === 'es'
      ? `¿Convertir a ${email} en gestor? Va a poder aprobar solicitudes y promover a otros usuarios.`
      : `Make ${email} a manager? They'll be able to approve requests and promote other users.`,
    deleteTitle: language === 'es' ? 'Eliminar usuario'                        : 'Delete user',
    deleteMsg:   (user) => language === 'es'
      ? `¿Eliminar a ${user.name || user.email} (${user.email})? Se borrarán también sus vehículos, su historial de mantenimiento, sus solicitudes y su suscripción. No se puede deshacer.`
      : `Delete ${user.name || user.email} (${user.email})? Their vehicles, maintenance history, requests and subscription will also be deleted. This can't be undone.`,
    deleteBtn:   language === 'es' ? 'Eliminar'                                : 'Delete',
    cancel:      language === 'es' ? 'Cancelar'                                : 'Cancel',
    confirm:     language === 'es' ? 'Confirmar'                               : 'Confirm',
    errorTitle:  language === 'es' ? 'Error'                                   : 'Error',
    emptyTitle:  language === 'es' ? 'Sin usuarios'                            : 'No users',
    emptyText:   language === 'es' ? 'No hay usuarios registrados.'            : 'No registered users.',
  };

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('user')
        .then((raw) => setCurrentUserId(raw ? JSON.parse(raw).id : null))
        .catch(() => {});
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
      showMessage(t.errorTitle, msg);
    } finally {
      setPromotingId(null);
    }
  };

  const confirmPromote = (user) => {
    confirmAction({
      title: t.confirmTitle,
      message: t.confirmMsg(user.email),
      confirmText: t.confirm,
      cancelText: t.cancel,
      onConfirm: () => promote(user),
    });
  };

  const removeUser = async (user) => {
    setDeletingId(user.id);
    try {
      await managerService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      showMessage(t.errorTitle, msg);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (user) => {
    confirmAction({
      title: t.deleteTitle,
      message: t.deleteMsg(user),
      confirmText: t.deleteBtn,
      cancelText: t.cancel,
      destructive: true,
      onConfirm: () => removeUser(user),
    });
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
        <View style={[styles.iconContainer, { backgroundColor: colors.primarySoft }]}>
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
        renderItem={({ item }) => {
          const isMe = item.id === currentUserId;
          return (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardText}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name}{isMe ? ` (${t.you})` : ''}
              </Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
            </View>
            {item.role === 'manager' ? (
              <View style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}>
                <ShieldCheck size={14} color={colors.primary} />
                <Text style={[styles.roleText, { color: colors.primary }]}>{t.manager}</Text>
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
            {!isMe && (
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                disabled={deletingId === item.id}
                accessibilityLabel={t.deleteTitle}
                style={[styles.deleteBtn, { borderColor: colors.border, opacity: deletingId === item.id ? 0.5 : 1 }]}
              >
                <Trash2 size={18} color={colors.danger || '#ef4444'} />
              </TouchableOpacity>
            )}
          </View>
          );
        }}
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
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
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
