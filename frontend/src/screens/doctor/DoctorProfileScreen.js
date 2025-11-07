import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';
import { colors } from '../../constants/theme';

const DoctorProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    specialization: '',
    license_number: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getProfile();
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        mobile_number: data.mobile_number || '',
        specialization: data.specialization || '',
        license_number: data.license_number || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
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
              await authService.logout();
              const rootNavigator = navigation.getParent()?.getParent();
              if (rootNavigator) {
                rootNavigator.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              }
            } catch (error) {
              console.error('Logout error:', error);
              try {
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
              } catch (storageError) {
                console.error('Storage clear error:', storageError);
              }
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
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
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Doctor Profile
            </Text>
            {!editing && (
              <Button mode="outlined" onPress={() => setEditing(true)}>
                Edit
              </Button>
            )}
          </View>

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
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Specialization"
                value={formData.specialization}
                onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="License Number"
                value={formData.license_number}
                onChangeText={(text) => setFormData({ ...formData, license_number: text })}
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditing(false);
                    loadProfile();
                  }}
                  style={styles.button}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdate}
                  style={styles.button}
                >
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Name:
                </Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.full_name || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Email:
                </Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Mobile:
                </Text>
                <Text variant="bodyLarge" style={styles.value}>
                  {user?.mobile_number || 'N/A'}
                </Text>
              </View>
              {user?.specialization && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Specialization:
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {user.specialization}
                  </Text>
                </View>
              )}
              {user?.license_number && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    License Number:
                  </Text>
                  <Text variant="bodyLarge" style={styles.value}>
                    {user.license_number}
                  </Text>
                </View>
              )}
            </>
          )}

          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            buttonColor={colors.error}
          >
            Logout
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
    marginBottom: 20,
  },
  title: {
    color: colors.textPrimary,
  },
  input: {
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  logoutButton: {
    marginTop: 20,
  },
  infoRow: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 5,
  },
  value: {
    color: colors.textPrimary,
  },
});

export default DoctorProfileScreen;

