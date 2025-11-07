import api from './api';
import { API_ENDPOINTS } from '../constants/api';

export const sharingService = {
  // Create share token
  createShareToken: async (data) => {
    const response = await api.post(API_ENDPOINTS.SHARE_TOKENS, data);
    return response.data;
  },

  // Get all share tokens
  getShareTokens: async () => {
    const response = await api.get(API_ENDPOINTS.SHARE_TOKENS);
    return response.data;
  },

  // Get share token detail
  getShareToken: async (tokenId) => {
    const response = await api.get(API_ENDPOINTS.SHARE_TOKEN_DETAIL(tokenId));
    return response.data;
  },

  // Revoke share token
  revokeShareToken: async (tokenId) => {
    const response = await api.delete(API_ENDPOINTS.SHARE_TOKEN_DETAIL(tokenId));
    return response.data;
  },

  // Get QR code image
  getQRCodeImage: async (tokenId) => {
    const response = await api.get(API_ENDPOINTS.QR_CODE_IMAGE(tokenId), {
      responseType: 'blob',
    });
    return response.data;
  },

  // Scan QR code
  scanQRCode: async (encryptedToken) => {
    const response = await api.post(API_ENDPOINTS.SCAN_QR, {
      encrypted_token: encryptedToken,
    });
    return response.data;
  },

  // Access via URL
  accessViaURL: async (tokenId) => {
    const response = await api.get(API_ENDPOINTS.ACCESS_VIA_URL(tokenId));
    return response.data;
  },

  // Get saved patients
  getSavedPatients: async () => {
    const response = await api.get(API_ENDPOINTS.SAVED_PATIENTS);
    return response.data;
  },

  // Save patient
  savePatient: async (data) => {
    const response = await api.post(API_ENDPOINTS.SAVED_PATIENTS, data);
    return response.data;
  },

  // Get saved patient detail
  getSavedPatient: async (patientId) => {
    const response = await api.get(API_ENDPOINTS.SAVED_PATIENT_DETAIL(patientId));
    return response.data;
  },

  // Update saved patient
  updateSavedPatient: async (patientId, data) => {
    const response = await api.put(API_ENDPOINTS.SAVED_PATIENT_DETAIL(patientId), data);
    return response.data;
  },

  // Delete saved patient
  deleteSavedPatient: async (patientId) => {
    const response = await api.delete(API_ENDPOINTS.SAVED_PATIENT_DETAIL(patientId));
    return response.data;
  },

  // Get doctor notes
  getDoctorNotes: async (patientId = null) => {
    const params = patientId ? { patient: patientId } : {};
    const response = await api.get(API_ENDPOINTS.DOCTOR_NOTES, { params });
    return response.data;
  },

  // Create doctor note
  createDoctorNote: async (data) => {
    const response = await api.post(API_ENDPOINTS.DOCTOR_NOTES, data);
    return response.data;
  },

  // Get access logs
  getAccessLogs: async () => {
    const response = await api.get(API_ENDPOINTS.ACCESS_LOGS);
    return response.data;
  },
};

