import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Platform, Linking } from "react-native";
import { Text, Button, Card, ActivityIndicator } from "react-native-paper";
import { Camera } from "expo-camera";
import { sharingService } from "../../services/sharingService";
import { colors } from "../../constants/theme";

const ScanQRScreen = ({ navigation }) => {
  const [permission, setPermission] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Request camera permission on mount
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission({ granted: status === "granted", status });
    } catch (error) {
      console.error("Permission check error:", error);
      setPermission({ granted: false, status: "undetermined" });
    }
  };

  const handleBarCodeScanned = async (result) => {
    if (loading || !scanning) return;

    setScanning(false);
    setLoading(true);

    try {
      // Handle both old and new API formats
      // In expo-camera SDK 49, the callback receives { data, type } or just data
      let data;
      if (typeof result === "string") {
        data = result;
      } else if (result?.data) {
        data = result.data;
      } else {
        console.error("Unexpected QR code format:", result);
        throw new Error("Invalid QR code format");
      }

      console.log("Scanned QR code data:", data);

      // The QR code should contain the encrypted token
      const encryptedToken = data;

      // Call the scan API
      const response = await sharingService.scanQRCode(encryptedToken);

      console.log("Scan response:", response);

      // Navigate to patient records screen
      navigation.navigate("PatientRecords", {
        patient: response.patient,
        records: response.records,
        accessLogId: response.access_log_id,
      });
    } catch (error) {
      console.error("QR scan error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Failed to scan QR code. Please try again.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Scan Failed", errorMessage, [
        {
          text: "OK",
          onPress: () => {
            setScanning(true);
            setLoading(false);
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    if (Platform.OS !== "web") {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setPermission({ granted: status === "granted", status });
        if (status !== "granted") {
          Alert.alert(
            "Camera Permission Required",
            "This app needs access to your camera to scan QR codes. Please enable camera permission in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      } catch (error) {
        console.error("Permission request error:", error);
        Alert.alert("Error", "Failed to request camera permission.");
      }
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Camera Permission Required
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              This app needs access to your camera to scan QR codes for
              accessing patient records.
            </Text>
            <Button
              mode="contained"
              onPress={handleRequestPermission}
              style={styles.button}
            >
              Grant Camera Permission
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={
          scanning && !loading ? handleBarCodeScanned : undefined
        }
        barCodeScannerSettings={{
          barCodeTypes: ["qr"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text variant="titleMedium" style={styles.instructionText}>
              Position QR code within the frame
            </Text>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text variant="bodySmall" style={styles.loadingText}>
                  Processing...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayMiddle: {
    flexDirection: "row",
    flex: 2,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  instructionText: {
    color: colors.textOnPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: colors.textOnPrimary,
    marginTop: 10,
  },
  card: {
    margin: 20,
    backgroundColor: colors.surface,
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    marginBottom: 20,
    textAlign: "center",
    color: colors.textSecondary,
  },
  button: {
    marginTop: 10,
  },
});

export default ScanQRScreen;
