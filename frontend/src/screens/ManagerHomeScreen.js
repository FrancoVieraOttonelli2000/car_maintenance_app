import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  LogOut, ChevronRight, Inbox, Users, Star, Car, ShieldCheck, Wrench,
  UserCircle, Settings, Trash2, UserCog, CircleCheck, Bell,
} from 'lucide-react-native';
import { managerService, requestService, alertService, clearSession } from '../services/api';
import AlertCard from '../components/AlertCard';
import { SettingsContext } from '../context/SettingsContext';
import { confirmAction, showMessage } from '../utils/dialogs';

// Panel de inicio del gestor: resumen del taller, solicitudes pendientes con
// acciones rápidas y accesos a la gestión. El cliente usa ClientHomeScreen.
const ManagerHomeScreen = ({ navigation, user }) => {
  const { colors, language, theme } = useContext(SettingsContext);
  const es = language === 'es';

  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [myAlerts, setMyAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const t = {
    panel:        es ? 'Panel de gestión' : 'Management panel',
    manager:      es ? 'Gestor' : 'Manager',
    summary:      es ? 'RESUMEN' : 'OVERVIEW',
    pendingTitle: es ? 'SOLICITUDES PENDIENTES' : 'PENDING REQUESTS',
    management:   es ? 'GESTIÓN' : 'MANAGEMENT',
    personal:     es ? 'PERSONAL' : 'PERSONAL',
    myAlertsTitle:es ? 'AVISOS DE MIS VEHÍCULOS' : 'MY VEHICLE ALERTS',
    viewAllAlerts:(n) => (es ? `Ver todos los avisos (${n})` : `View all alerts (${n})`),
    alerts:       es ? 'Avisos' : 'Alerts',
    alertsSub:    es ? 'Mantenimientos pendientes de tus vehículos' : 'Pending maintenance on your vehicles',
    statPending:  es ? 'Solicitudes\npendientes' : 'Pending\nrequests',
    statClients:  es ? 'Clientes' : 'Clients',
    statSubs:     es ? 'Suscripciones\nactivas' : 'Active\nsubscriptions',
    statCars:     es ? 'Vehículos\nregistrados' : 'Registered\nvehicles',
    newUsers:     (n) => (es ? `${n} ${n === 1 ? 'nuevo' : 'nuevos'} en 30 días` : `${n} new in 30 days`),
    managers:     (n) => (es ? `${n} ${n === 1 ? 'gestor' : 'gestores'}` : `${n} manager${n === 1 ? '' : 's'}`),
    services:     (n) => (es ? `${n} ${n === 1 ? 'servicio' : 'servicios'} en 30 días` : `${n} service${n === 1 ? '' : 's'} in 30 days`),
    resolved:     (n) => (es ? `${n} ${n === 1 ? 'resuelta' : 'resueltas'} esta semana` : `${n} resolved this week`),
    allClear:     es ? 'Nada pendiente' : 'Nothing pending',
    allClearSub:  es ? 'No hay solicitudes de clientes por revisar.' : 'No client requests to review.',
    viewAll:      (n) => (es ? `Ver todas (${n})` : `View all (${n})`),
    approve:      es ? 'Aprobar' : 'Approve',
    reject:       es ? 'Rechazar' : 'Reject',
    cancel:       es ? 'Cancelar' : 'Cancel',
    approveTitle: es ? 'Aprobar solicitud' : 'Approve request',
    rejectTitle:  es ? 'Rechazar solicitud' : 'Reject request',
    approveMsg:   (d, who) => (es ? `${d}\nSolicitado por ${who}.\n\nEl cambio se aplicará al momento.` : `${d}\nRequested by ${who}.\n\nThe change will be applied immediately.`),
    rejectMsg:    (d, who) => (es ? `${d}\nSolicitado por ${who}.` : `${d}\nRequested by ${who}.`),
    error:        es ? 'Error' : 'Error',
    requests:     es ? 'Solicitudes' : 'Requests',
    requestsSub:  es ? 'Historial y solicitudes de clientes' : 'Client requests and history',
    users:        es ? 'Usuarios' : 'Users',
    usersSub:     es ? 'Promueve o elimina usuarios' : 'Promote or delete users',
    garage:       es ? 'Mi Garaje' : 'My Garage',
    garageSub:    es ? 'Tus vehículos personales' : 'Your own vehicles',
    profile:      es ? 'Mi Perfil' : 'My Profile',
    profileSub:   es ? 'Editar nombre y correo' : 'Edit name and email',
    settings:     es ? 'Ajustes' : 'Settings',
    settingsSub:  es ? 'Tema, idioma y unidades' : 'Theme, language & units',
    unknownUser:  es ? 'Usuario eliminado' : 'Deleted user',
  };

  const load = async () => {
    try {
      const [statsRes, pendingRes, alertsRes] = await Promise.all([
        managerService.getStats(),
        requestService.list(),
        // Avisos de los coches propios del gestor (si tiene alguno).
        user?.id ? alertService.getUserAlerts(user.id).catch(() => ({ data: [] })) : { data: [] },
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data);
      setMyAlerts(alertsRes.data);
    } catch (error) {
      console.error('Failed to load manager dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [user?.id]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const describe = (r) => {
    const p = r.payload || {};
    if (r.type === 'delete_vehicle') {
      const car = p.plate ? `${p.plate}${p.brand ? ` · ${p.brand} ${p.model || ''}`.trimEnd() : ''}` : `#${p.car_id}`;
      return { icon: Trash2, color: colors.danger, text: es ? `Eliminar vehículo ${car}` : `Delete vehicle ${car}` };
    }
    if (r.type === 'edit_user_data') {
      const field = p.field === 'email' ? (es ? 'correo' : 'email') : (es ? 'nombre' : 'name');
      return { icon: UserCog, color: colors.primary, text: es ? `Cambiar ${field} a "${p.new_value}"` : `Change ${field} to "${p.new_value}"` };
    }
    return { icon: Inbox, color: colors.primary, text: r.type };
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString(es ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short' });
  };

  const act = (r, action) => {
    const { text } = describe(r);
    const who = r.user_name || r.user_email || t.unknownUser;
    const approve = action === 'approve';
    confirmAction({
      title: approve ? t.approveTitle : t.rejectTitle,
      message: approve ? t.approveMsg(text, who) : t.rejectMsg(text, who),
      confirmText: approve ? t.approve : t.reject,
      cancelText: t.cancel,
      destructive: !approve,
      onConfirm: async () => {
        setBusyId(r.id);
        try {
          if (approve) await requestService.approve(r.id);
          else await requestService.reject(r.id);
        } catch (error) {
          showMessage(t.error, error?.response?.data?.error || error?.message || 'Error');
        } finally {
          setBusyId(null);
          load();
        }
      },
    });
  };

  const pendingCount = stats?.requests.pending ?? pending.length;

  const statCards = [
    {
      icon: Inbox,
      value: pendingCount,
      label: t.statPending,
      foot: stats ? t.resolved(stats.requests.resolvedLast7Days) : '',
      color: pendingCount > 0 ? colors.danger : colors.primary,
      highlight: pendingCount > 0,
      onPress: () => navigation.navigate('ManagerRequests'),
    },
    {
      icon: Users,
      value: stats?.users.clients ?? '–',
      label: t.statClients,
      foot: stats ? `${t.newUsers(stats.users.newLast30Days)} · ${t.managers(stats.users.managers)}` : '',
      color: colors.primary,
      onPress: () => navigation.navigate('ManagerUsers'),
    },
    {
      icon: Star,
      value: stats?.subscriptions.active ?? '–',
      label: t.statSubs,
      foot: '',
      color: colors.primary,
    },
    {
      icon: Car,
      value: stats?.cars.total ?? '–',
      label: t.statCars,
      foot: stats ? t.services(stats.maintenance.last30Days) : '',
      color: colors.primary,
    },
  ];

  const MenuSection = ({ title, items }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg || colors.primarySoft }]}>
                  <Icon size={20} color={item.iconColor || colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                </View>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabecera */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.headerAccent }]}>
            <ShieldCheck size={22} color={colors.headerBg} />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.kicker, { color: colors.headerText, opacity: 0.7 }]}>{t.panel}</Text>
            <Text style={[styles.userName, { color: colors.headerText }]} numberOfLines={1}>{user?.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.rolePill, { borderColor: colors.headerAccent }]}>
            <Text style={[styles.rolePillText, { color: colors.headerAccent }]}>{t.manager}</Text>
          </View>
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: 'rgba(255,255,255,0.18)' }]} onPress={handleLogout}>
            <LogOut size={18} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Resumen */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.summary}</Text>
        <View style={styles.grid}>
          {statCards.map((s) => {
            const Icon = s.icon;
            const Wrapper = s.onPress ? TouchableOpacity : View;
            return (
              <Wrapper
                key={s.label}
                onPress={s.onPress}
                activeOpacity={0.7}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: s.highlight ? colors.danger : colors.border,
                  },
                ]}
              >
                <View style={styles.statTop}>
                  <Icon size={18} color={s.color} />
                  {s.onPress ? <ChevronRight size={14} color={colors.textSecondary} /> : null}
                </View>
                <Text style={[styles.statValue, { color: s.highlight ? colors.danger : colors.text }]}>
                  {loading && !stats ? '–' : s.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                {s.foot ? <Text style={[styles.statFoot, { color: colors.textSecondary }]} numberOfLines={2}>{s.foot}</Text> : null}
              </Wrapper>
            );
          })}
        </View>
      </View>

      {/* Solicitudes pendientes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.pendingTitle}</Text>
        {!loading && pending.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CircleCheck size={26} color="#16a34a" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.allClear}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t.allClearSub}</Text>
          </View>
        ) : (
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {pending.slice(0, 3).map((r, i) => {
              const d = describe(r);
              const Icon = d.icon;
              const busy = busyId === r.id;
              return (
                <View key={r.id}>
                  {i > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                  <View style={[styles.reqRow, { opacity: busy ? 0.5 : 1 }]}>
                    <View style={styles.reqHead}>
                      <View style={[styles.reqIcon, { backgroundColor: colors.primarySoft }]}>
                        <Icon size={16} color={d.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reqText, { color: colors.text }]} numberOfLines={2}>{d.text}</Text>
                        <Text style={[styles.reqMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                          {(r.user_name || r.user_email || t.unknownUser)} · {formatDate(r.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reqActions}>
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => act(r, 'reject')}
                        style={[styles.reqBtn, { borderColor: colors.border }]}
                      >
                        <Text style={[styles.reqBtnText, { color: colors.textSecondary }]}>{t.reject}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => act(r, 'approve')}
                        style={[styles.reqBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      >
                        <Text style={[styles.reqBtnText, { color: colors.onPrimary }]}>{t.approve}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
            {pending.length > 3 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ManagerRequests')}
                style={[styles.viewAll, { borderTopColor: colors.border }]}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>{t.viewAll(pending.length)}</Text>
                <ChevronRight size={15} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Avisos de los vehículos propios: solo si hay alguno */}
      {myAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t.myAlertsTitle}</Text>
          {myAlerts.slice(0, 3).map((a, i) => <AlertCard key={`${a.car_id}-${a.type_name}-${i}`} alert={a} />)}
          {myAlerts.length > 3 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Alerts')}
              style={[styles.viewAll, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>{t.viewAllAlerts(myAlerts.length)}</Text>
              <ChevronRight size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <MenuSection
        title={t.management}
        items={[
          { icon: Inbox, label: t.requests, sub: t.requestsSub, onPress: () => navigation.navigate('ManagerRequests'), badge: pendingCount > 0 ? pendingCount : null },
          { icon: Users, label: t.users, sub: t.usersSub, onPress: () => navigation.navigate('ManagerUsers') },
        ]}
      />

      <MenuSection
        title={t.personal}
        items={[
          { icon: Car, label: t.garage, sub: t.garageSub, onPress: () => navigation.navigate('MyCars'), iconColor: colors.textSecondary },
          { icon: Bell, label: t.alerts, sub: t.alertsSub, onPress: () => navigation.navigate('Alerts'), iconColor: myAlerts.length > 0 ? colors.danger : colors.textSecondary, badge: myAlerts.length > 0 ? myAlerts.length : null },
          { icon: UserCircle, label: t.profile, sub: t.profileSub, onPress: () => navigation.navigate('EditProfile'), iconColor: colors.textSecondary },
          { icon: Settings, label: t.settings, sub: t.settingsSub, onPress: () => navigation.navigate('Settings'), iconColor: colors.textSecondary },
        ]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  userName: { fontSize: 18, fontWeight: '800' },
  rolePill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 132,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2, lineHeight: 16 },
  statFoot: { fontSize: 11, marginTop: 6 },
  menuCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  menuSub: { fontSize: 12 },
  menuDivider: { height: 1, marginHorizontal: 16 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  reqRow: { padding: 14, gap: 12 },
  reqHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reqIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  reqText: { fontSize: 14, fontWeight: '700' },
  reqMeta: { fontSize: 12, marginTop: 2 },
  reqActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  reqBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  reqBtnText: { fontSize: 13, fontWeight: '700' },
  viewAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderTopWidth: 1, gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  emptyBox: { padding: 24, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});

export default ManagerHomeScreen;
