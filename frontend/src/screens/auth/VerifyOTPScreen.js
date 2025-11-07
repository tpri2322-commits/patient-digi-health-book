import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { authService } from '../../services/authService';
import { colors } from '../../constants/theme';

const VerifyOTPScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOTP(email, otpCode);
      
      // Show success message
      Alert.alert(
        'Success',
        result.message || 'Email verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Login - AppNavigator will detect auth state and redirect
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      // Handle validation errors from Django REST Framework
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if it's a validation error object
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const errorFields = Object.keys(errorData);
          if (errorFields.length > 0) {
            // Get first error message
            const firstError = errorData[errorFields[0]];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const data = await authService.resendOTP(email, 'REGISTRATION');
      
      Alert.alert(
        'OTP Resent',
        data.debug_note 
          ? `New OTP: ${data.otp_code}\n\n${data.debug_note}`
          : 'A new OTP has been sent to your email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card} elevation={0}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.logoContainer}>
            <Text variant="headlineLarge" style={styles.title}>
              Verify Email
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Enter the 6-digit OTP sent to {email}
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <TextInput
              label="OTP Code"
              value={otpCode}
              onChangeText={setOtpCode}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              left={<TextInput.Icon icon="key" />}
            />
            <Button
              mode="contained"
              onPress={handleVerify}
              loading={loading}
              style={styles.verifyButton}
              contentStyle={styles.buttonContent}
            >
              Verify
            </Button>
            <Button
              mode="outlined"
              onPress={handleResendOTP}
              loading={resending}
              style={styles.resendButton}
            >
              Resend OTP
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              Back to Login
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
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
  verifyButton: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  resendButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default VerifyOTPScreen;

