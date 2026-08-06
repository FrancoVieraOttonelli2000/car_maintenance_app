import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
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
  activate: (data) => api.post('/subscriptions/activate', data),
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
