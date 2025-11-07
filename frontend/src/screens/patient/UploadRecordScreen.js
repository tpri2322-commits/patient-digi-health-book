import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL } from '../../constants/api';
import { recordsService } from '../../services/recordsService';
import { colors } from '../../constants/theme';

const UploadRecordScreen = ({ route, navigation }) => {
  // Get preselected document type from navigation params
  const preselectedType = route.params?.preselectedType;
  
  const [formData, setFormData] = useState({
    document_type: preselectedType || 'PRESCRIPTION',
    source_doctor: '',
    date_of_record: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);

  // Check if all mandatory fields are filled
  const isFormValid = () => {
    return !!(
      file &&
      fileUri &&
      formData.source_doctor &&
      formData.source_doctor.trim() !== '' &&
      formData.date_of_record &&
      formData.document_type
    );
  };

  const documentTypes = [
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'LAB_REPORT', label: 'Lab Report' },
    { value: 'SCAN', label: 'Scan' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Update document type when route params change (e.g., when navigating from filtered view)
  useEffect(() => {
    if (route.params?.preselectedType && route.params.preselectedType !== formData.document_type) {
      setFormData(prev => ({
        ...prev,
        document_type: route.params.preselectedType,
      }));
    }
  }, [route.params?.preselectedType]);

  // Check permissions on component mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      // Check camera permission
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermission(cameraStatus.status);

      // Check media library permission
      const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      setMediaLibraryPermission(mediaStatus.status);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status);

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'This app needs access to your camera to take photos of medical records. Please enable camera permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMediaLibraryPermission(status);

    if (status !== 'granted') {
      Alert.alert(
        'Media Library Permission Required',
        'This app needs access to your photo library to select medical record images. Please enable photo library permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    // Check and request camera permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setFile({
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          uri: asset.uri,
          type: 'image/jpeg',
          mimeType: 'image/jpeg',
        });
        setFileUri(asset.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseImage = async () => {
    // Check and request media library permission
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setFile({
          name: asset.fileName || `image_${Date.now()}.jpg`,
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          mimeType: asset.mimeType || 'image/jpeg',
        });
        setFileUri(asset.uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handlePickFile = async () => {
    try {
      // DocumentPicker handles permissions automatically on iOS/Android
      // But we should check if the user cancelled or if there was an error
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setFile({
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || 'application/pdf',
          mimeType: asset.mimeType || 'application/pdf',
        });
        setFileUri(asset.uri);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        // User cancelled, no need to show error
        return;
      }
      Alert.alert(
        'Error',
        'Failed to pick file. Please make sure you have granted file access permissions.'
      );
    }
  };

  const handleUpload = async () => {
    if (!file || !fileUri) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    if (!formData.source_doctor || formData.source_doctor.trim() === '') {
      Alert.alert('Error', 'Please enter the doctor/clinic name.');
      return;
    }

    setLoading(true);
    try {
      const uploadFormData = new FormData();
      
      // Add file - React Native FormData format
      // The file object must have uri, type, and name properties
      // For React Native, we need to ensure the URI is properly formatted
      let fileExtension = 'jpg';
      if (file.name) {
        const parts = file.name.split('.');
        if (parts.length > 1) {
          fileExtension = parts[parts.length - 1].toLowerCase();
        }
      } else if (fileUri) {
        // Try to extract extension from URI
        const uriParts = fileUri.split('.');
        if (uriParts.length > 1) {
          fileExtension = uriParts[uriParts.length - 1].toLowerCase().split('?')[0];
        }
      }
      
      const fileName = file.name || `record_${Date.now()}.${fileExtension}`;
      const mimeType = file.mimeType || 
        (fileExtension === 'pdf' ? 'application/pdf' : 
         fileExtension === 'png' ? 'image/png' : 
         fileExtension === 'jpeg' || fileExtension === 'jpg' ? 'image/jpeg' : 'image/jpeg');
      
      // Ensure fileUri is a string and properly formatted
      // React Native FormData needs the full URI including file:// prefix
      const fileUriString = typeof fileUri === 'string' ? fileUri : fileUri?.uri || fileUri;
      
      // Create file object for React Native FormData
      // React Native FormData expects: { uri: string, type: string, name: string }
      // The uri must be a local file path (file://) for React Native
      const fileObject = {
        uri: fileUriString,
        type: mimeType,
        name: fileName,
      };
      
      console.log('File object for upload:', {
        uri: fileUriString.substring(0, 100),
        type: mimeType,
        name: fileName,
      });
      
      // Append file to FormData
      // In React Native, FormData.append() accepts an object with uri, type, and name
      uploadFormData.append('file', fileObject);

      // Add other fields as strings
      uploadFormData.append('document_type', formData.document_type);
      uploadFormData.append('source_doctor', formData.source_doctor.trim());
      uploadFormData.append('date_of_record', formData.date_of_record);
      if (formData.notes && formData.notes.trim()) {
        uploadFormData.append('notes', formData.notes.trim());
      }

      console.log('Uploading file:', {
        fileName,
        mimeType,
        uri: fileUri ? (fileUri.length > 50 ? fileUri.substring(0, 50) + '...' : fileUri) : 'No URI',
        documentType: formData.document_type,
        doctor: formData.source_doctor,
        date: formData.date_of_record,
        apiBaseURL: API_BASE_URL,
      });

      const response = await recordsService.uploadRecord(uploadFormData);
      
      console.log('Upload successful:', response);
      
      Alert.alert(
        'Success',
        'Record uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form but preserve preselected type
              setFile(null);
              setFileUri(null);
              setFormData({
                document_type: preselectedType || 'PRESCRIPTION',
                source_doctor: '',
                date_of_record: new Date().toISOString().split('T')[0],
                notes: '',
              });
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('API Base URL:', API_BASE_URL);
      
      let errorMessage = 'Failed to upload record. Please try again.';
      
      // Handle network errors specifically
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = `Network error: Cannot connect to server at ${API_BASE_URL}. Please check:\n1. Backend server is running\n2. Device and computer are on the same network\n3. Firewall is not blocking the connection`;
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle different error formats
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.file) {
          // File validation errors
          if (Array.isArray(errorData.file)) {
            errorMessage = errorData.file[0];
          } else if (typeof errorData.file === 'string') {
            errorMessage = errorData.file;
          }
        } else if (errorData.document_type) {
          errorMessage = `Document type error: ${Array.isArray(errorData.document_type) ? errorData.document_type[0] : errorData.document_type}`;
        } else if (errorData.source_doctor) {
          errorMessage = `Doctor name error: ${Array.isArray(errorData.source_doctor) ? errorData.source_doctor[0] : errorData.source_doctor}`;
        } else if (errorData.date_of_record) {
          errorMessage = `Date error: ${Array.isArray(errorData.date_of_record) ? errorData.date_of_record[0] : errorData.date_of_record}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Upload Medical Record
          </Text>

          <View style={styles.fileSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select File
            </Text>
            <View style={styles.fileButtons}>
              <Button
                mode="outlined"
                icon="camera"
                onPress={handleTakePhoto}
                style={styles.fileButton}
                disabled={loading}
              >
                Take Photo
              </Button>
              <Button
                mode="outlined"
                icon="image"
                onPress={handleChooseImage}
                style={styles.fileButton}
                disabled={loading}
              >
                Choose Image
              </Button>
            </View>
            <View style={styles.fileButtons}>
              <Button
                mode="outlined"
                icon="file-document"
                onPress={handlePickFile}
                style={[styles.fileButton, styles.fullWidthButton]}
                disabled={loading}
              >
                Choose File (PDF/Image)
              </Button>
            </View>
            {file && (
              <View style={styles.fileInfo}>
                <Text variant="bodyMedium" style={styles.fileName}>
                  Selected: {file.name || 'File'}
                </Text>
                <Text variant="bodySmall" style={styles.fileType}>
                  Type: {file.mimeType || 'Unknown'}
                </Text>
              </View>
            )}
          </View>

          <SegmentedButtons
            value={formData.document_type}
            onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            buttons={documentTypes}
            style={styles.segmentedButtons}
            theme={{
              colors: {
                secondaryContainer: colors.primary,
                onSecondaryContainer: colors.textOnPrimary,
                outline: colors.border,
              }
            }}
          />

          <TextInput
            label="Doctor/Clinic Name *"
            value={formData.source_doctor}
            onChangeText={(text) => setFormData({ ...formData, source_doctor: text })}
            mode="outlined"
            style={styles.input}
            required
            error={!formData.source_doctor || formData.source_doctor.trim() === ''}
            helperText={(!formData.source_doctor || formData.source_doctor.trim() === '') ? 'This field is required' : ''}
          />

          <TextInput
            label="Date of Record *"
            value={formData.date_of_record}
            onChangeText={(text) => setFormData({ ...formData, date_of_record: text })}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            error={!formData.date_of_record}
            helperText={!formData.date_of_record ? 'This field is required' : ''}
          />

          <TextInput
            label="Notes (Optional)"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleUpload}
            loading={loading}
            disabled={loading || !isFormValid()}
            style={styles.uploadButton}
          >
            Upload Record
          </Button>
          {!isFormValid() && (
            <Text variant="bodySmall" style={styles.validationHint}>
              Please fill all required fields: File, Doctor/Clinic Name, and Date
            </Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  card: {
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  fileSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  fileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fileButton: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  fullWidthButton: {
    flex: 1,
    marginHorizontal: 0,
  },
  fileInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
  },
  fileName: {
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 5,
  },
  fileType: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  segmentedButtons: {
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  uploadButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  validationHint: {
    marginTop: 5,
    marginBottom: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default UploadRecordScreen;

