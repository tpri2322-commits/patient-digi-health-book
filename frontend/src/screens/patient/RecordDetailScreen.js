import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { recordsService } from '../../services/recordsService';
import { API_BASE_URL } from '../../constants/api';
import { colors, getDocumentTypeColor } from '../../constants/theme';

const RecordDetailScreen = ({ route, navigation }) => {
  const { recordId } = route.params;
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    source_doctor: '',
    date_of_record: '',
    notes: '',
  });

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await recordsService.getRecord(recordId);
      setRecord(data);
      setFormData({
        source_doctor: data.source_doctor || '',
        date_of_record: data.date_of_record || '',
        notes: data.notes || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load record details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await recordsService.updateRecord(recordId, formData);
      Alert.alert('Success', 'Record updated successfully.');
      setEditing(false);
      loadRecord();
    } catch (error) {
      Alert.alert('Error', 'Failed to update record.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recordsService.deleteRecord(recordId);
              Alert.alert('Success', 'Record deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    try {
      await recordsService.archiveRecord(recordId);
      Alert.alert('Success', `Record ${record.is_archived ? 'unarchived' : 'archived'} successfully.`);
      loadRecord();
    } catch (error) {
      Alert.alert('Error', 'Failed to archive record.');
    }
  };

  const handleViewFile = () => {
    if (record?.file_url) {
      Linking.openURL(record.file_url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {record.file_name}
            </Text>
            {!editing && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setEditing(true)}
              />
            )}
          </View>

          <Chip 
            style={[styles.chip, { 
              borderColor: getDocumentTypeColor(record.document_type),
            }]} 
            mode="outlined"
            selected={false}
          >
            {record.document_type}
          </Chip>

          {editing ? (
            <>
              <TextInput
                label="Doctor/Clinic Name"
                value={formData.source_doctor}
                onChangeText={(text) => setFormData({ ...formData, source_doctor: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Date of Record"
                value={formData.date_of_record}
                onChangeText={(text) => setFormData({ ...formData, date_of_record: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditing(false);
                    loadRecord();
                  }}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleUpdate}>
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.label}>
                Doctor/Clinic
              </Text>
              <Text variant="bodyLarge" style={styles.value}>
                {record.source_doctor}
              </Text>

              <Text variant="titleMedium" style={styles.label}>
                Date of Record
              </Text>
              <Text variant="bodyLarge" style={styles.value}>
                {new Date(record.date_of_record).toLocaleDateString()}
              </Text>

              {record.notes && (
                <>
                  <Text variant="titleMedium" style={styles.label}>
                    Notes
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {record.notes}
                  </Text>
                </>
              )}

              <Text variant="titleMedium" style={styles.label}>
                File Size
              </Text>
              <Text variant="bodyLarge" style={styles.value}>
                {(record.file_size / (1024 * 1024)).toFixed(2)} MB
              </Text>

              <Button
                mode="contained"
                icon="file-document"
                onPress={handleViewFile}
                style={styles.button}
              >
                View File
              </Button>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  icon={record.is_archived ? 'archive-off' : 'archive'}
                  onPress={handleArchive}
                  style={styles.button}
                >
                  {record.is_archived ? 'Unarchive' : 'Archive'}
                </Button>
                <Button
                  mode="outlined"
                  icon="share"
                  onPress={() => navigation.navigate('ShareRecords', { recordIds: [recordId] })}
                  style={styles.button}
                >
                  Share
                </Button>
                <Button
                  mode="outlined"
                  icon="delete"
                  onPress={handleDelete}
                  style={[styles.button, styles.deleteButton]}
                  textColor={colors.error}
                >
                  Delete
                </Button>
              </View>
            </>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  label: {
    marginTop: 15,
    marginBottom: 5,
    color: colors.textSecondary,
  },
  value: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    marginTop: 10,
  },
  actionButtons: {
    marginTop: 20,
  },
  deleteButton: {
    borderColor: colors.error,
  },
});

export default RecordDetailScreen;

