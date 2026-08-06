import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { alertService, subscriptionService, requestService } from '../services/api';
import AlertCard from '../components/AlertCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, Bell, Settings, LogOut, ChevronRight, Wrench, AlertTriangle, ClipboardList, Star, Inbox, Users } from 'lucide-react-native';
import { SettingsContext } from '../context/SettingsContext';

const HomeScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'Usuario' });
  const [pendingRequests, setPendingRequests] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, language, theme } = useContext(SettingsContext);

  useFocusEffect(useCallback(() => {
    loadData();
    checkSubscription();
  }, []));

  const checkSubscription = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const parsedUser = userData ? JSON.parse(userData) : null;
      if (parsedUser?.role === 'manager') return; // managers don't have subscriptions
      const r = await subscriptionService.getStatus();
      if (r.data?.active === false) navigation.replace('Subscription');
    } catch { /* fail open si no hay red */ }
  };

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.role === 'manager') {
          fetchPendingRequests();
        } else {
          fetchAlerts(parsedUser.id);
        }
      }
    } catch { console.error('Failed to load user data'); }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await requestService.list();
      setPendingRequests(response.data.length);
    } catch { console.error('Failed to fetch pending requests'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchAlerts = async (userId) => {
    try {
      const response = await alertService.getUserAlerts(userId);
      setAlerts(response.data);
    } catch { console.error('Failed to fetch alerts'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (!user.id) return;
    if (user.role === 'manager') fetchPendingRequests();
    else fetchAlerts(user.id);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const isDark = theme === 'dark';

  const menuItems = [
    {
      icon: Car,
      label: language === 'es' ? 'Mi Garaje' : 'My Garage',
      sub: language === 'es' ? 'Gestiona tus vehículos' : 'Manage your vehicles',
      onPress: () => navigation.navigate('MyCars'),
      iconBg: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(29,78,216,0.08)',
    },
    {
      icon: Bell,
      label: language === 'es' ? 'Avisos' : 'Alerts',
      sub: language === 'es' ? 'Revisa tareas pendientes' : 'Check pending tasks',
      onPress: () => navigation.navigate('Alerts'),
      iconBg: 'rgba(220,38,38,0.08)',
      iconColor: colors.danger,
      badge: alerts.length > 0 ? alerts.length : null,
    },
    {
      icon: ClipboardList,
      label: language === 'es' ? 'Plan de Mantenimiento' : 'Maintenance Plan',
      sub: language === 'es' ? 'Consulta el plan por vehículo' : 'Check plan by vehicle',
      onPress: () => navigation.navigate('MaintenancePlan'),
      iconBg: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)',
      iconColor: '#16a34a',
    },
    {
      icon: Settings,
      label: language === 'es' ? 'Ajustes' : 'Settings',
      sub: language === 'es' ? 'Tema, idioma y unidades' : 'Theme, language & units',
      onPress: () => navigation.navigate('Settings'),
      iconBg: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(100,116,139,0.1)',
      iconColor: colors.textSecondary,
    },
    ...(user.role === 'manager' ? [] : [{
      icon: Star,
      label: language === 'es' ? 'Mi Suscripción' : 'My Subscription',
      sub: language === 'es' ? 'Gestiona tu plan Premium' : 'Manage your Premium plan',
      onPress: () => navigation.navigate('Subscription'),
      iconBg: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(234,179,8,0.10)',
      iconColor: '#eab308',
    }]),
    ...(user.role === 'manager' ? [
      {
        icon: Inbox,
        label: language === 'es' ? 'Solicitudes' : 'Requests',
        sub: language === 'es' ? 'Aprueba o rechaza pedidos de clientes' : 'Approve or reject client requests',
        onPress: () => navigation.navigate('ManagerRequests'),
        iconBg: isDark ? 'rgba(212,175,55,0.12)' : 'rgba(29,78,216,0.08)',
        badge: pendingRequests > 0 ? pendingRequests : null,
      },
      {
        icon: Users,
        label: language === 'es' ? 'Usuarios' : 'Users',
        sub: language === 'es' ? 'Consulta usuarios y promueve gestores' : 'View users and promote managers',
        onPress: () => navigation.navigate('ManagerUsers'),
        iconBg: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(100,116,139,0.1)',
        iconColor: colors.textSecondary,
      },
    ] : []),
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {language === 'es' ? 'Bienvenido,' : 'Welcome,'}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.border }]} onPress={handleLogout}>
          <LogOut size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      {user.role === 'manager' ? (
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Inbox size={16} color={pendingRequests > 0 ? colors.danger : colors.textSecondary} />
            <Text style={[styles.statLabel, { color: pendingRequests > 0 ? colors.danger : colors.textSecondary }]}>
              {pendingRequests} {language === 'es' ? 'Solicitudes pendientes' : 'Pending requests'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Wrench size={16} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === 'es' ? 'Mantenimiento' : 'Maintenance'}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <AlertTriangle size={16} color={alerts.length > 0 ? colors.danger : colors.textSecondary} />
            <Text style={[styles.statLabel, { color: alerts.length > 0 ? colors.danger : colors.textSecondary }]}>
              {alerts.length} {language === 'es' ? 'Alertas' : 'Alerts'}
            </Text>
          </View>
        </View>
      )}

      {/* Menu list */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {language === 'es' ? 'MENÚ PRINCIPAL' : 'MAIN MENU'}
        </Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const iconColor = item.iconColor ?? colors.primary;
            return (
              <React.Fragment key={i}>
                {i > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                  <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                    <Icon size={20} color={iconColor} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                  </View>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Recent alerts */}
      {user.role !== 'manager' && !loading && alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {language === 'es' ? 'ALERTAS RECIENTES' : 'RECENT ALERTS'}
          </Text>
          {alerts.slice(0, 3).map((alert, i) => (
            <AlertCard key={i} alert={alert} />
          ))}
          {alerts.length > 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={[styles.viewAll, { borderColor: colors.border }]}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                {language === 'es' ? `Ver todas (${alerts.length})` : `View all (${alerts.length})`}
              </Text>
              <ChevronRight size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {user.role !== 'manager' && !loading && alerts.length === 0 && (
        <View style={[styles.allGoodBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 28 }}>✓</Text>
          <Text style={[styles.allGoodText, { color: colors.text }]}>
            {language === 'es' ? '¡Todo al día!' : 'All clear!'}
          </Text>
          <Text style={[styles.allGoodSub, { color: colors.textSecondary }]}>
            {language === 'es' ? 'No hay mantenimientos pendientes.' : 'No pending maintenance.'}
          </Text>
        </View>
      )}
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
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  greeting: { fontSize: 12, fontWeight: '500' },
  userName: { fontSize: 18, fontWeight: '800' },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statDivider: { width: 1, height: 24, marginHorizontal: 8 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  menuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  menuSub: { fontSize: 12 },
  menuDivider: { height: 1, marginHorizontal: 16 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  allGoodBox: {
    margin: 16,
    marginTop: 20,
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginBottom: 40,
  },
  allGoodText: { fontSize: 18, fontWeight: '800' },
  allGoodSub: { fontSize: 13, textAlign: 'center' },
});

export default HomeScreen;
