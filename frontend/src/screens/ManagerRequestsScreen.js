import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestService, managerService } from '../services/api';
import ButtonPrimary from '../components/ButtonPrimary';
import { Inbox, Car, UserCog } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const STATUS_TABS = ['pending', 'all'];

const ManagerRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [statusTab, setStatusTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, language } = useContext(SettingsContext);

  const t = {
    title:      language === 'es' ? 'Solicitudes'                              : 'Requests',
    subtitle:   language === 'es' ? 'Aprobá o rechazá los pedidos de tus clientes' : "Approve or reject your clients' requests",
    pending:    language === 'es' ? 'Pendientes'                                : 'Pending',
    all:        language === 'es' ? 'Todas'                                    : 'All',
    approve:    language === 'es' ? 'Aprobar'                                  : 'Approve',
    reject:     language === 'es' ? 'Rechazar'                                 : 'Reject',
    emptyTitle: language === 'es' ? 'Sin solicitudes'                          : 'No requests',
    emptyText:  language === 'es' ? 'No hay solicitudes en esta vista.'        : 'Nothing to show here.',
    unknownUser:language === 'es' ? 'Usuario desconocido'                      : 'Unknown user',
    errorTitle: language === 'es' ? 'Error'                                    : 'Error',
    statusLabels: {
      pending:  language === 'es' ? 'Pendiente'  : 'Pending',
      approved: language === 'es' ? 'Aprobada'   : 'Approved',
      rejected: language === 'es' ? 'Rechazada'  : 'Rejected',
    },
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [statusTab])
  );

  const fetchAll = async () => {
    try {
      const [requestsRes, usersRes] = await Promise.all([
        requestService.list(statusTab === 'all' ? 'all' : undefined),
        managerService.listUsers(),
      ]);
      setRequests(requestsRes.data);
      const map = {};
      usersRes.data.forEach((u) => { map[u.id] = u; });
      setUsersById(map);
    } catch (error) {
      console.error('Error fetching requests', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleApprove = async (id) => {
    try {
      await requestService.approve(id);
      fetchAll();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      Alert.alert(t.errorTitle, msg);
      fetchAll(); // p. ej. si se rechazó sola porque el coche ya no existía
    }
  };

  const handleReject = async (id) => {
    try {
      await requestService.reject(id);
      fetchAll();
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Error desconocido';
      Alert.alert(t.errorTitle, msg);
    }
  };

  const describeRequest = (request) => {
    if (request.type === 'delete_vehicle') {
      const p = request.payload || {};
      // Las solicitudes nuevas guardan matrícula, marca y modelo; las antiguas
      // solo tienen el id del coche.
      const carLabel = p.plate
        ? `${p.plate}${p.brand ? ` — ${p.brand} ${p.model || ''}`.trimEnd() : ''}`
        : `#${p.car_id}`;
      return language === 'es'
        ? `Eliminar vehículo ${carLabel}`
        : `Delete vehicle ${carLabel}`;
    }
    if (request.type === 'edit_user_data') {
      const fieldLabels = {
        name: language === 'es' ? 'nombre' : 'name',
        email: language === 'es' ? 'correo electrónico' : 'email',
      };
      const fieldLabel = fieldLabels[request.payload?.field] || request.payload?.field;
      return language === 'es'
        ? `Cambiar ${fieldLabel} a "${request.payload?.new_value}"`
        : `Change ${fieldLabel} to "${request.payload?.new_value}"`;
    }
    return request.type;
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
          <Inbox size={32} color={colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setStatusTab(tab)}
            style={[
              styles.tab,
              { borderColor: colors.border },
              statusTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.tabText, { color: statusTab === tab ? colors.onPrimary : colors.textSecondary }]}>
              {tab === 'pending' ? t.pending : t.all}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const requester = usersById[item.user_id];
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>
                  {item.type === 'delete_vehicle'
                    ? <Car size={18} color={colors.primary} />
                    : <UserCog size={18} color={colors.primary} />}
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{describeRequest(item)}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                    {requester
                      ? `${requester.name} (${requester.email})`
                      : item.user_name ? `${item.user_name} (${item.user_email})` : t.unknownUser}
                  </Text>
                  {item.status !== 'pending' && item.resolution_note ? (
                    <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                      {item.resolution_note}
                    </Text>
                  ) : null}
                  <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
                {statusTab === 'all' && (
                  <Text style={[styles.statusBadge, {
                    color: item.status === 'approved' ? '#16a34a' : item.status === 'rejected' ? colors.danger : '#eab308',
                  }]}>
                    {t.statusLabels[item.status]}
                  </Text>
                )}
              </View>

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <ButtonPrimary onPress={() => handleReject(item.id)} variant="outline" style={styles.actionButton}>
                    {t.reject}
                  </ButtonPrimary>
                  <ButtonPrimary onPress={() => handleApprove(item.id)} style={styles.actionButton}>
                    {t.approve}
                  </ButtonPrimary>
                </View>
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
  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '700' },
  listContainer: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardSub: { fontSize: 12, fontWeight: '500' },
  cardDate: { fontSize: 11 },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: { flex: 1, paddingVertical: 10 },
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

export default ManagerRequestsScreen;
