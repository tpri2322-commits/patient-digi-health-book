import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, SegmentedButtons } from 'react-native-paper';
import { authService } from '../../services/authService';
import { colors } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    mobile_number: '',
    full_name: '',
    role: 'PATIENT',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.email || !formData.mobile_number || !formData.full_name || 
        !formData.password || !formData.password_confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Send all data including password_confirm as backend expects it
      await authService.register(formData);
      navigation.navigate('VerifyOTP', { email: formData.email });
    } catch (error) {
      // Handle validation errors from Django REST Framework
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if it's a validation error object
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const errorFields = Object.keys(errorData);
          if (errorFields.length > 0) {
            // Collect all error messages
            const errorMessages = [];
            errorFields.forEach(field => {
              const fieldErrors = errorData[field];
              if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach(err => errorMessages.push(`${field}: ${err}`));
              } else if (typeof fieldErrors === 'string') {
                errorMessages.push(`${field}: ${fieldErrors}`);
              }
            });
            errorMessage = errorMessages.join('\n') || errorMessage;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.join('\n');
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={0}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.logoContainer}>
            <Text variant="headlineLarge" style={styles.title}>
              Create Account
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Join our secure healthcare platform
            </Text>
          </View>
          <View style={styles.formContainer}>
            <TextInput
              label="Full Name"
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              label="Mobile Number"
              value={formData.mobile_number}
              onChangeText={(text) => setFormData({ ...formData, mobile_number: text })}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />
            <SegmentedButtons
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              buttons={[
                { value: 'PATIENT', label: 'Patient' },
                { value: 'DOCTOR', label: 'Doctor' },
              ]}
              style={styles.input}
              theme={{
                colors: {
                  secondaryContainer: colors.primary,
                  onSecondaryContainer: colors.textOnPrimary,
                  outline: colors.border,
                }
              }}
            />
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              helperText="Must be at least 8 characters and not too common"
            />
            <TextInput
              label="Confirm Password"
              value={formData.password_confirm}
              onChangeText={(text) => setFormData({ ...formData, password_confirm: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
            />
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              Register
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Already have an account? Login
            </Button>
          </View>
          
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              Crafted with care at VIT Vellore
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    elevation: 0,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  formContainer: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  loginButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RegisterScreen;

