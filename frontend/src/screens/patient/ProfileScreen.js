import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';
import { recordsService } from '../../services/recordsService';
import { colors } from '../../constants/theme';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    allergies: '',
    chronic_conditions: '',
  });
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadProfile();
    loadStatistics();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        mobile_number: data.mobile_number || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        blood_group: data.blood_group || '',
        allergies: data.allergies || '',
        chronic_conditions: data.chronic_conditions || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await recordsService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await authService.updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully.');
      setEditing(false);
      loadProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear tokens - this will be detected by AppNavigator's checkAuth
              await authService.logout();
              
              // Navigate to root navigator and reset to Login screen
              // ProfileScreen is in PatientTabs, which is in Root Stack
              // So we need to go up 1 level to reach the root Stack navigator
              const rootNavigator = navigation.getParent()?.getParent();
              if (rootNavigator) {
                rootNavigator.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              } else {
                // Fallback: try going up just one level
                const parentNav = navigation.getParent();
                if (parentNav) {
                  parentNav.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    })
                  );
                }
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout API call fails, ensure tokens are cleared
              try {
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
              } catch (storageError) {
                console.error('Storage clear error:', storageError);
              }
              
              // Force navigation reset
              const rootNavigator = navigation.getParent()?.getParent();
              if (rootNavigator) {
                rootNavigator.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              }
            }
          },
        },
      ]
    );
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
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Profile
          </Text>

          {statistics && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {statistics.total_records}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Records
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {statistics.total_size_mb} MB
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Storage Used
                </Text>
              </View>
            </View>
          )}

          {editing ? (
            <>
              <TextInput
                label="Full Name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Mobile Number"
                value={formData.mobile_number}
                onChangeText={(text) => setFormData({ ...formData, mobile_number: text })}
                mode="outlined"
                style={styles.input}
                editable={false}
              />
              <TextInput
                label="Date of Birth"
                value={formData.date_of_birth}
                onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                mode="outlined"
                style={styles.input}
                placeholder="YYYY-MM-DD"
              />
              <SegmentedButtons
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                buttons={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
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
                label="Blood Group"
                value={formData.blood_group}
                onChangeText={(text) => setFormData({ ...formData, blood_group: text })}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., O+, A-, B+"
              />
              <TextInput
                label="Allergies"
                value={formData.allergies}
                onChangeText={(text) => setFormData({ ...formData, allergies: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="List any allergies"
              />
              <TextInput
                label="Chronic Conditions"
                value={formData.chronic_conditions}
                onChangeText={(text) => setFormData({ ...formData, chronic_conditions: text })}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="List any chronic conditions"
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditing(false);
                    loadProfile();
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
              <View style={styles.infoRow}>
                <Text variant="titleMedium" style={styles.label}>Email:</Text>
                <Text variant="bodyLarge" style={styles.value}>{user?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="titleMedium" style={styles.label}>Full Name:</Text>
                <Text variant="bodyLarge" style={styles.value}>{user?.full_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="titleMedium" style={styles.label}>Mobile:</Text>
                <Text variant="bodyLarge" style={styles.value}>{user?.mobile_number}</Text>
              </View>
              {user?.patient_uuid && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Patient UUID:</Text>
                  <Text variant="bodySmall" style={styles.value}>{user.patient_uuid}</Text>
                </View>
              )}
              {user?.date_of_birth && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Date of Birth:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{user.date_of_birth}</Text>
                </View>
              )}
              {user?.gender && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Gender:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{user.gender}</Text>
                </View>
              )}
              {user?.blood_group && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Blood Group:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{user.blood_group}</Text>
                </View>
              )}
              {user?.allergies && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Allergies:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{user.allergies}</Text>
                </View>
              )}
              {user?.chronic_conditions && (
                <View style={styles.infoRow}>
                  <Text variant="titleMedium" style={styles.label}>Chronic Conditions:</Text>
                  <Text variant="bodyLarge" style={styles.value}>{user.chronic_conditions}</Text>
                </View>
              )}

              <Button
                mode="contained"
                icon="pencil"
                onPress={() => setEditing(true)}
                style={styles.button}
              >
                Edit Profile
              </Button>
              <Button
                mode="outlined"
                icon="lock"
                onPress={() => navigation.navigate('ChangePassword')}
                style={styles.button}
              >
                Change Password
              </Button>
              <Button
                mode="outlined"
                icon="logout"
                onPress={handleLogout}
                style={[styles.button, styles.logoutButton]}
                textColor={colors.error}
              >
                Logout
              </Button>
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
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  input: {
    marginBottom: 15,
  },
  segmentedButtons: {
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
  logoutButton: {
    borderColor: colors.error,
    marginTop: 20,
  },
});

export default ProfileScreen;

