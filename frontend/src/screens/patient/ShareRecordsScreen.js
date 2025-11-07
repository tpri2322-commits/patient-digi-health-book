import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import {
  Card,
  Text,
  Button,
  SegmentedButtons,
  TextInput,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { sharingService } from '../../services/sharingService';
import { API_BASE_URL } from '../../constants/api';
import { colors } from '../../constants/theme';

const ShareRecordsScreen = ({ route, navigation }) => {
  const { recordIds } = route.params || { recordIds: [] };
  const [shareMethod, setShareMethod] = useState('QR_CODE');
  const [expiryHours, setExpiryHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);

  const handleShare = async () => {
    if (!recordIds || recordIds.length === 0) {
      Alert.alert('Error', 'Please select at least one record to share.');
      return;
    }

    // Validate expiry hours
    const expiryHoursNum = parseInt(expiryHours);
    if (isNaN(expiryHoursNum) || expiryHoursNum < 1 || expiryHoursNum > 168) {
      Alert.alert('Error', 'Please enter a valid expiry time between 1 and 168 hours.');
      return;
    }

    setLoading(true);
    try {
      // Ensure recordIds are strings (UUIDs)
      const formattedRecordIds = recordIds.map(id => String(id));
      
      console.log('Creating share token:', {
        recordIds: formattedRecordIds,
        shareMethod,
        expiryHours: expiryHoursNum,
      });

      const data = await sharingService.createShareToken({
        record_ids: formattedRecordIds,
        share_method: shareMethod,
        expiry_hours: expiryHoursNum,
      });

      console.log('Share token created:', data);

      setShareToken(data);

      if (shareMethod === 'QR_CODE' && data.qr_code_image) {
        setQrCodeImage(data.qr_code_image);
      } else if (shareMethod === 'QR_CODE' && data.qr_code_data) {
        // If backend returns QR code data instead of image, we might need to generate it
        // For now, just use the data URL if available
        setQrCodeImage(data.qr_code_image || `data:image/png;base64,${data.qr_code_data}`);
      }
    } catch (error) {
      console.error('Share token creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create share token. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.record_ids) {
          // Record validation errors
          if (Array.isArray(errorData.record_ids)) {
            errorMessage = `Record error: ${errorData.record_ids[0]}`;
          } else if (typeof errorData.record_ids === 'string') {
            errorMessage = `Record error: ${errorData.record_ids}`;
          }
        } else if (errorData.share_method) {
          errorMessage = `Share method error: ${Array.isArray(errorData.share_method) ? errorData.share_method[0] : errorData.share_method}`;
        } else if (errorData.expiry_hours) {
          errorMessage = `Expiry hours error: ${Array.isArray(errorData.expiry_hours) ? errorData.expiry_hours[0] : errorData.expiry_hours}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // Try to extract first error message
          const errorKeys = Object.keys(errorData);
          if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const firstError = errorData[firstKey];
            if (Array.isArray(firstError)) {
              errorMessage = `${firstKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
              errorMessage = `${firstKey}: ${firstError}`;
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Share Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!shareToken) return;

    Alert.alert(
      'Revoke Share',
      'Are you sure you want to revoke this share token?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingService.revokeShareToken(shareToken.id);
              Alert.alert('Success', 'Share token revoked successfully.');
              setShareToken(null);
              setQrCodeImage(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke share token.');
            }
          },
        },
      ]
    );
  };

  const handleCopyUrl = async () => {
    if (!shareToken?.share_url) return;
    
    try {
      await Clipboard.setStringAsync(shareToken.share_url);
      Alert.alert('Success', 'URL copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy URL to clipboard.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Share Medical Records
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sharing {recordIds?.length || 0} record(s)
          </Text>

          <SegmentedButtons
            value={shareMethod}
            onValueChange={setShareMethod}
            buttons={[
              { value: 'QR_CODE', label: 'QR Code' },
              { value: 'URL', label: 'Secure URL' },
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

          <Text variant="titleMedium" style={styles.label}>
            Expiry Time (hours)
          </Text>
          <TextInput
            value={expiryHours}
            onChangeText={setExpiryHours}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          {!shareToken ? (
            <Button
              mode="contained"
              onPress={handleShare}
              loading={loading}
              style={styles.button}
            >
              Generate Share Link
            </Button>
          ) : (
            <View style={styles.shareResult}>
              <Text variant="titleLarge" style={[styles.successTitle, { color: colors.success }]}>
                Share Created Successfully!
              </Text>

              {shareMethod === 'QR_CODE' && qrCodeImage && (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: qrCodeImage }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                  <Text variant="bodySmall" style={styles.qrHint}>
                    Doctor can scan this QR code to access your records
                  </Text>
                </View>
              )}

              {shareMethod === 'URL' && shareToken.share_url && (
                <View style={styles.urlContainer}>
                  <View style={styles.urlHeader}>
                    <Text variant="bodyMedium" style={styles.urlLabel}>
                      Share URL:
                    </Text>
                    <IconButton
                      icon="content-copy"
                      size={20}
                      onPress={handleCopyUrl}
                      iconColor={colors.primary}
                    />
                  </View>
                  <View style={styles.urlTextContainer}>
                    <Text variant="bodySmall" style={styles.urlText} selectable>
                      {shareToken.share_url}
                    </Text>
                  </View>
                  <Button
                    mode="outlined"
                    icon="content-copy"
                    onPress={handleCopyUrl}
                    style={styles.copyButton}
                    compact
                  >
                    Copy URL
                  </Button>
                </View>
              )}

              <Text variant="bodySmall" style={styles.expiryText}>
                Expires: {new Date(shareToken.expires_at).toLocaleString()}
              </Text>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={handleRevoke}
                  style={styles.button}
                >
                  Revoke Access
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShareToken(null);
                    setQrCodeImage(null);
                  }}
                  style={styles.button}
                >
                  Create New Share
                </Button>
              </View>
            </View>
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
  card: {
    margin: 10,
    elevation: 4,
    backgroundColor: colors.surface,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  shareResult: {
    marginTop: 20,
  },
  successTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 10,
  },
  qrHint: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  urlContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 5,
  },
  urlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  urlLabel: {
    flex: 1,
  },
  urlTextContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  urlText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  copyButton: {
    marginTop: 5,
  },
  expiryText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
  },
  actionButtons: {
    marginTop: 20,
  },
});

export default ShareRecordsScreen;

