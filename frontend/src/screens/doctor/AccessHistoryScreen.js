import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { sharingService } from '../../services/sharingService';
import { colors } from '../../constants/theme';

const AccessHistoryScreen = () => {
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccessLogs();
  }, []);

  const loadAccessLogs = async () => {
    try {
      setLoading(true);
      const data = await sharingService.getAccessLogs();
      setAccessLogs(data.results || data || []);
    } catch (error) {
      console.error('Failed to load access logs:', error);
      Alert.alert('Error', 'Failed to load access history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {accessLogs.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No access history yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Your QR code scans and patient record accesses will appear here
            </Text>
          </Card.Content>
        </Card>
      ) : (
        accessLogs.map((log) => {
          const patient = log.patient_info || log.patient || {};
          const records = log.accessed_records || [];
          
          return (
            <Card key={log.id} style={styles.card}>
              <Card.Content>
                <View style={styles.header}>
                  <Text variant="titleMedium" style={styles.patientName}>
                    {patient.full_name || 'Unknown Patient'}
                  </Text>
                  {log.accessed_at && (
                    <Text variant="bodySmall" style={styles.date}>
                      {new Date(log.accessed_at).toLocaleString()}
                    </Text>
                  )}
                </View>

                {patient.patient_uuid && (
                  <Text variant="bodySmall" style={styles.uuid}>
                    UUID: {patient.patient_uuid}
                  </Text>
                )}

                {records.length > 0 && (
                  <View style={styles.recordsContainer}>
                    <Text variant="bodySmall" style={styles.recordsLabel}>
                      Records Accessed: {records.length}
                    </Text>
                    {records.slice(0, 3).map((record) => (
                      <Chip
                        key={record.id || record}
                        style={styles.recordChip}
                        mode="outlined"
                      >
                        {typeof record === 'string' ? record : record.file_name || 'Record'}
                      </Chip>
                    ))}
                    {records.length > 3 && (
                      <Text variant="bodySmall" style={styles.moreRecords}>
                        +{records.length - 3} more
                      </Text>
                    )}
                  </View>
                )}

                {log.ip_address && (
                  <Text variant="bodySmall" style={styles.meta}>
                    IP: {log.ip_address}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientName: {
    flex: 1,
    color: colors.textPrimary,
  },
  date: {
    color: colors.textSecondary,
  },
  uuid: {
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  recordsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
  },
  recordsLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.textSecondary,
  },
  recordChip: {
    marginRight: 5,
    marginBottom: 5,
  },
  moreRecords: {
    marginTop: 5,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  meta: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 12,
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

export default AccessHistoryScreen;

