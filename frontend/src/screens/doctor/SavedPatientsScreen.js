import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Searchbar,
  IconButton,
  Menu,
} from 'react-native-paper';
import { sharingService } from '../../services/sharingService';
import { colors } from '../../constants/theme';

const SavedPatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState({});

  useEffect(() => {
    loadSavedPatients();
  }, []);

  const loadSavedPatients = async () => {
    try {
      setLoading(true);
      const data = await sharingService.getSavedPatients();
      setPatients(data.results || data || []);
    } catch (error) {
      console.error('Failed to load saved patients:', error);
      Alert.alert('Error', 'Failed to load saved patients.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to remove this patient from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingService.deleteSavedPatient(patientId);
              Alert.alert('Success', 'Patient removed from saved list.');
              loadSavedPatients();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete patient.');
            }
          },
        },
      ]
    );
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const name = patient.patient_info?.full_name || '';
    const uuid = patient.patient_info?.patient_uuid || '';
    return name.toLowerCase().includes(query) || uuid.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name or UUID"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
          inputStyle={{ color: colors.textPrimary }}
        />
      </View>

      {filteredPatients.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery ? 'No patients found' : 'No saved patients yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Patients you save after scanning QR codes will appear here'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        filteredPatients.map((item) => {
          const patient = item.patient_info || item.patient || {};
          return (
            <Card key={item.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.patientInfo}>
                    <Text variant="titleMedium" style={styles.patientName}>
                      {patient.full_name || 'Unknown Patient'}
                    </Text>
                    {patient.patient_uuid && (
                      <Text variant="bodySmall" style={styles.patientUuid}>
                        UUID: {patient.patient_uuid}
                      </Text>
                    )}
                    {patient.mobile_number && (
                      <Text variant="bodySmall" style={styles.contact}>
                        {patient.mobile_number}
                      </Text>
                    )}
                  </View>
                  <Menu
                    visible={menuVisible[item.id] || false}
                    onDismiss={() => setMenuVisible({ ...menuVisible, [item.id]: false })}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() =>
                          setMenuVisible({ ...menuVisible, [item.id]: true })
                        }
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setMenuVisible({ ...menuVisible, [item.id]: false });
                        // Navigate to Scan tab's PatientRecords screen
                        navigation.navigate('Scan', {
                          screen: 'PatientRecords',
                          params: {
                            patient: patient,
                            records: [],
                            accessLogId: null,
                          },
                        });
                      }}
                      title="View Records"
                    />
                    <Menu.Item
                      onPress={() => {
                        setMenuVisible({ ...menuVisible, [item.id]: false });
                        handleDeletePatient(item.id);
                      }}
                      title="Remove"
                    />
                  </Menu>
                </View>

                {item.consultation_notes && (
                  <View style={styles.notesContainer}>
                    <Text variant="bodySmall" style={styles.notesLabel}>
                      Consultation Notes:
                    </Text>
                    <Text variant="bodyMedium" style={styles.notes}>
                      {item.consultation_notes}
                    </Text>
                  </View>
                )}

                {item.saved_at && (
                  <Text variant="bodySmall" style={styles.date}>
                    Saved: {new Date(item.saved_at).toLocaleDateString()}
                  </Text>
                )}
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: colors.surface,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: colors.surface,
  },
  card: {
    margin: 12,
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    marginBottom: 5,
    color: colors.textPrimary,
  },
  patientUuid: {
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  contact: {
    color: colors.textSecondary,
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.textSecondary,
  },
  notes: {
    color: colors.textPrimary,
  },
  date: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 10,
    color: colors.textPrimary,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

export default SavedPatientsScreen;

