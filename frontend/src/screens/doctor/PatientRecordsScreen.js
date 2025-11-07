import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Linking } from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { sharingService } from '../../services/sharingService';
import { colors, getDocumentTypeColor } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/api';

const PatientRecordsScreen = ({ route, navigation }) => {
  const { patient, records: initialRecords, accessLogId } = route.params || {};
  const [records, setRecords] = useState(initialRecords || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');

  const handleSavePatient = async () => {
    if (!patient?.patient_uuid) {
      Alert.alert('Error', 'Patient information not available.');
      return;
    }

    setSaving(true);
    try {
      await sharingService.savePatient({
        patient: patient.patient_uuid,
        consultation_notes: consultationNotes.trim() || undefined,
      });
      Alert.alert('Success', 'Patient details saved successfully!');
      setShowSaveForm(false);
      setConsultationNotes('');
    } catch (error) {
      console.error('Save patient error:', error);
      Alert.alert('Error', 'Failed to save patient details.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewRecord = (record) => {
    if (record.file_url) {
      Linking.openURL(record.file_url);
    } else {
      Alert.alert('Error', 'File URL not available.');
    }
  };

  if (!patient || !records || records.length === 0) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              No Records Found
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              No patient records available.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Scan Another QR Code
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <View style={styles.patientInfo}>
              <Text variant="headlineSmall" style={styles.patientName}>
                {patient.full_name || 'Patient'}
              </Text>
              {patient.patient_uuid && (
                <Text variant="bodySmall" style={styles.patientUuid}>
                  UUID: {patient.patient_uuid}
                </Text>
              )}
              {patient.mobile_number && (
                <Text variant="bodySmall" style={styles.patientContact}>
                  {patient.mobile_number}
                </Text>
              )}
              {patient.blood_group && (
                <Chip style={styles.chip} mode="outlined">
                  Blood Group: {patient.blood_group}
                </Chip>
              )}
            </View>
          </View>

          {patient.allergies && (
            <View style={styles.infoSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Allergies
              </Text>
              <Text variant="bodyMedium">{patient.allergies}</Text>
            </View>
          )}

          {patient.chronic_conditions && (
            <View style={styles.infoSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Chronic Conditions
              </Text>
              <Text variant="bodyMedium">{patient.chronic_conditions}</Text>
            </View>
          )}

          <View style={styles.recordsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Medical Records ({records.length})
            </Text>
            {records.map((record) => (
              <Card key={record.id} style={styles.recordCard}>
                <Card.Content>
                  <View style={styles.recordHeader}>
                    <Text variant="titleMedium" style={styles.recordTitle}>
                      {record.file_name}
                    </Text>
                    <Chip
                      style={[
                        styles.chip,
                        {
                          borderColor: getDocumentTypeColor(record.document_type),
                        },
                      ]}
                      mode="outlined"
                      selected={false}
                    >
                      {record.document_type}
                    </Chip>
                  </View>
                  {record.source_doctor && (
                    <Text variant="bodyMedium" style={styles.doctor}>
                      Dr. {record.source_doctor}
                    </Text>
                  )}
                  {record.date_of_record && (
                    <Text variant="bodySmall" style={styles.date}>
                      Date: {new Date(record.date_of_record).toLocaleDateString()}
                    </Text>
                  )}
                  {record.notes && (
                    <Text variant="bodySmall" style={styles.notes}>
                      Notes: {record.notes}
                    </Text>
                  )}
                  <Button
                    mode="outlined"
                    icon="file-document"
                    onPress={() => handleViewRecord(record)}
                    style={styles.viewButton}
                  >
                    View Document
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>

          {!showSaveForm ? (
            <Button
              mode="contained"
              icon="account-plus"
              onPress={() => setShowSaveForm(true)}
              style={styles.button}
            >
              Save Patient Details
            </Button>
          ) : (
            <Card style={styles.saveFormCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Save Patient for Future Reference
                </Text>
                <TextInput
                  label="Consultation Notes (Optional)"
                  value={consultationNotes}
                  onChangeText={setConsultationNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                />
                <View style={styles.saveFormActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowSaveForm(false);
                      setConsultationNotes('');
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSavePatient}
                    loading={saving}
                    disabled={saving}
                    style={styles.saveButton}
                  >
                    Save
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="outlined"
            icon="qrcode-scan"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Scan Another QR Code
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: 12,
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  patientHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  patientInfo: {
    marginBottom: 10,
  },
  patientName: {
    marginBottom: 5,
    color: colors.textPrimary,
  },
  patientUuid: {
    color: colors.textSecondary,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  patientContact: {
    color: colors.textSecondary,
    marginBottom: 10,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  infoSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    marginBottom: 10,
    color: colors.textPrimary,
  },
  recordsSection: {
    marginBottom: 20,
  },
  recordCard: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recordTitle: {
    flex: 1,
    marginRight: 10,
  },
  doctor: {
    marginTop: 5,
    color: colors.textSecondary,
  },
  date: {
    marginTop: 5,
    color: colors.textSecondary,
  },
  notes: {
    marginTop: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  viewButton: {
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
  saveFormCard: {
    marginTop: 20,
    marginBottom: 10,
    elevation: 0,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  input: {
    marginBottom: 15,
  },
  saveFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

export default PatientRecordsScreen;

