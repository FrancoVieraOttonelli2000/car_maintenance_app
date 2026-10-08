import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { resetTo } from '../navigation/navigationRef';

// URL del backend. Para un móvil real o para producción, créala en
// frontend/.env:   EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api
// (la IP de tu PC en la red local, o la URL del servidor). Si no existe, se
// usa la del emulador de Android / localhost, como hasta ahora.
const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Respuestas globales:
// - 401: el token caducó o el usuario ya no existe -> cerrar sesión.
// - 402: no hay suscripción activa -> pantalla de suscripción.
// El error se sigue propagando para que cada pantalla pare su carga.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register');

    if (status === 401 && !isAuthCall) {
      await AsyncStorage.multiRemove(['token', 'user']);
      resetTo('Login');
    } else if (status === 402) {
      resetTo('Subscription');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Guarda en el móvil los datos básicos del usuario (los que usan las pantallas).
export const saveUser = async (data) => {
  await AsyncStorage.setItem('user', JSON.stringify({
    id: data.id, name: data.name, email: data.email, role: data.role,
  }));
};

export const carService = {
  getUserCars: (userId) => api.get(`/cars/user/${userId}`),
  getCarById: (id) => api.get(`/cars/${id}`),
  createCar: (data) => api.post('/cars', data),
  updateKm: (id, kmData) => api.post(`/cars/${id}/km`, kmData),
};

export const maintenanceService = {
  getTypes: () => api.get('/maintenance/types'),
  getCarMaintenance: (carId) => api.get(`/maintenance/cars/${carId}/maintenance`),
  createMaintenance: (data) => api.post('/maintenance', data),
};

export const alertService = {
  getUserAlerts: (userId) => api.get(`/alerts/${userId}`),
};

export const subscriptionService = {
  createPaymentIntent: (plan) => api.post('/subscriptions/create-payment-intent', { plan }),
  activate: (paymentIntentId) => api.post('/subscriptions/activate', { paymentIntentId }),
  getStatus: () => api.get('/subscriptions/status'),
};

export const managerService = {
  listUsers: () => api.get('/managers/users'),
  promote: (email) => api.post('/managers/promote', { email }),
};

export const requestService = {
  create: (type, payload) => api.post('/requests', { type, payload }),
  list: (status) => api.get('/requests', { params: status ? { status } : {} }),
  approve: (id) => api.post(`/requests/${id}/approve`),
  reject: (id, note) => api.post(`/requests/${id}/reject`, note ? { note } : {}),
};

export const carAssistantService = {
  ask: (carId, questionType) => api.post('/car-assistant/ask', { carId, questionType }),
};

export const maintenancePlanService = {
  getMarcas: () => api.get('/maintenance-plans/marcas'),
  getModelos: (marca) => api.get(`/maintenance-plans/modelos/${encodeURIComponent(marca)}`),
  getVersiones: (marca, modelo) => api.get(`/maintenance-plans/versiones/${encodeURIComponent(marca)}/${encodeURIComponent(modelo)}`),
  getMotorizacion: (marca, modelo, version) => api.get(`/maintenance-plans/motorizacion/${encodeURIComponent(marca)}/${encodeURIComponent(modelo)}/${encodeURIComponent(version)}`),
  getPlan: (marca, modelo, version) => api.get(`/maintenance-plans/plan/${encodeURIComponent(marca)}/${encodeURIComponent(modelo)}/${encodeURIComponent(version)}`),
  getAlertas: (marca, modelo, version, kmActual, fechaUltimoServicio) =>
    api.get(`/maintenance-plans/alertas/${encodeURIComponent(marca)}/${encodeURIComponent(modelo)}/${encodeURIComponent(version)}`, {
      params: { kmActual, fechaUltimoServicio }
    }),
  getAlertasByCar: (carId) => api.get(`/maintenance-plans/alertas-car/${carId}`),
};

export default api;
