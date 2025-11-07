import api from './api';
import { API_ENDPOINTS } from '../constants/api';

export const recordsService = {
  // Get all records
  getRecords: async (filters = {}) => {
    const response = await api.get(API_ENDPOINTS.RECORDS, { params: filters });
    return response.data;
  },

  // Get record detail
  getRecord: async (recordId) => {
    const response = await api.get(API_ENDPOINTS.RECORD_DETAIL(recordId));
    return response.data;
  },

  // Upload record
  uploadRecord: async (formData) => {
    // Log the API URL being used
    console.log('Upload URL:', `${api.defaults.baseURL}${API_ENDPOINTS.RECORDS}`);
    
    // Don't set Content-Type header - let axios set it with boundary for multipart/form-data
    try {
      const response = await api.post(API_ENDPOINTS.RECORDS, formData, {
        headers: {
          // Explicitly don't set Content-Type - axios will set it with boundary
        },
        timeout: 120000, // 120 seconds timeout for file uploads (increased)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (error) {
      console.error('Upload request error:', {
        message: error.message,
        code: error.code,
        baseURL: api.defaults.baseURL,
        endpoint: API_ENDPOINTS.RECORDS,
        fullURL: `${api.defaults.baseURL}${API_ENDPOINTS.RECORDS}`,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Update record
  updateRecord: async (recordId, data) => {
    const response = await api.put(API_ENDPOINTS.RECORD_DETAIL(recordId), data);
    return response.data;
  },

  // Delete record
  deleteRecord: async (recordId) => {
    const response = await api.delete(API_ENDPOINTS.RECORD_DETAIL(recordId));
    return response.data;
  },

  // Archive/Unarchive record
  archiveRecord: async (recordId) => {
    const response = await api.post(API_ENDPOINTS.ARCHIVE_RECORD(recordId));
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get(API_ENDPOINTS.RECORD_STATISTICS);
    return response.data;
  },
};

