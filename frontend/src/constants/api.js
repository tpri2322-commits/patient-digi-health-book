// API Configuration
import { Platform } from "react-native";

// For iOS Simulator: use localhost
// For Android Emulator: use 10.0.2.2 (special IP that maps to host's localhost)
// For Physical Devices: use your computer's IP address
// Your computer IP: 10.72.232.206 (update this if your IP changes)
// To find your IP: On Mac/Linux run `ifconfig | grep "inet "`, On Windows run `ipconfig`

// Your computer's local IP address (update this if your network changes)
// Set this to your computer's IP when using physical device
const COMPUTER_IP = "10.158.190.211";

// Set to true if running on physical device, false for emulator/simulator
// When using Expo Go on physical device, set this to true
const USE_PHYSICAL_DEVICE_IP = true; // Change to true when using physical device

const getBaseURL = () => {
  if (!__DEV__) {
    return "https://your-production-api.com/api";
  }

  if (Platform.OS === "android") {
    // If using physical device, use computer IP; otherwise use emulator IP
    if (USE_PHYSICAL_DEVICE_IP) {
      return `http://${COMPUTER_IP}:8000/api`; // Physical Android device
    } else {
      return "http://10.0.2.2:8000/api"; // Android emulator
    }
  }

  // iOS
  if (USE_PHYSICAL_DEVICE_IP) {
    return `http://${COMPUTER_IP}:8000/api`; // Physical iOS device
  } else {
    return "http://localhost:8000/api"; // iOS simulator
  }
};

export const API_BASE_URL = getBaseURL();

export const API_ENDPOINTS = {
  // Auth
  REGISTER: "/auth/register/",
  VERIFY_OTP: "/auth/verify-otp/",
  RESEND_OTP: "/auth/resend-otp/",
  LOGIN: "/auth/login/",
  PROFILE: "/auth/profile/",
  CHANGE_PASSWORD: "/auth/change-password/",
  PASSWORD_RESET_REQUEST: "/auth/password-reset/request/",
  PASSWORD_RESET: "/auth/password-reset/",
  LOGOUT: "/auth/logout/",
  REFRESH_TOKEN: "/auth/token/refresh/",

  // Records
  RECORDS: "/records/",
  RECORD_DETAIL: (id) => `/records/${id}/`,
  ARCHIVE_RECORD: (id) => `/records/${id}/archive/`,
  RECORD_STATISTICS: "/records/statistics/",

  // Sharing
  SHARE_TOKENS: "/sharing/tokens/",
  SHARE_TOKEN_DETAIL: (id) => `/sharing/tokens/${id}/`,
  QR_CODE_IMAGE: (id) => `/sharing/tokens/${id}/qr-code/`,
  SCAN_QR: "/sharing/scan/",
  ACCESS_VIA_URL: (id) => `/sharing/access/${id}/`,
  SAVED_PATIENTS: "/sharing/saved-patients/",
  SAVED_PATIENT_DETAIL: (id) => `/sharing/saved-patients/${id}/`,
  DOCTOR_NOTES: "/sharing/notes/",
  DOCTOR_NOTE_DETAIL: (id) => `/sharing/notes/${id}/`,
  ACCESS_LOGS: "/sharing/access-logs/",

  // Admin
  ADMIN_STATISTICS: "/admin/statistics/",
  ADMIN_USERS: "/admin/users/",
  ADMIN_USER_DETAIL: (id) => `/admin/users/${id}/`,
  ADMIN_ACTIVATE_USER: (id) => `/admin/users/${id}/activate/`,
  ADMIN_RESET_PASSWORD: (id) => `/admin/users/${id}/reset-password/`,
  ADMIN_PATIENT_RECORDS: (id) => `/admin/users/${id}/records/`,
  ADMIN_AUDIT_TRAIL: (uuid) => `/admin/audit-trail/${uuid}/`,
  ADMIN_ACCESS_LOGS: "/admin/access-logs/",
};
