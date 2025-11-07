import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { colors } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import UploadRecordScreen from '../screens/patient/UploadRecordScreen';
import RecordDetailScreen from '../screens/patient/RecordDetailScreen';
import ShareRecordsScreen from '../screens/patient/ShareRecordsScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import ShareHistoryScreen from '../screens/patient/ShareHistoryScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import ScanQRScreen from '../screens/doctor/ScanQRScreen';
import PatientRecordsScreen from '../screens/doctor/PatientRecordsScreen';
import SavedPatientsScreen from '../screens/doctor/SavedPatientsScreen';
import AccessHistoryScreen from '../screens/doctor/AccessHistoryScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Patient Stack Navigator (for nested navigation)
const PatientStack = createStackNavigator();

const PatientStackNavigator = () => (
  <PatientStack.Navigator 
    screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <PatientStack.Screen 
      name="RecordsList" 
      component={PatientHomeScreen}
      options={{ title: 'My Medical Records' }}
    />
    <PatientStack.Screen 
      name="UploadRecord" 
      component={UploadRecordScreen}
      options={{ title: 'Upload Record' }}
    />
    <PatientStack.Screen 
      name="RecordDetail" 
      component={RecordDetailScreen}
      options={{ title: 'Record Details' }}
    />
    <PatientStack.Screen 
      name="ShareRecords" 
      component={ShareRecordsScreen}
      options={{ title: 'Share Records' }}
    />
  </PatientStack.Navigator>
);

// Patient Tab Navigator
const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={PatientStackNavigator}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="ShareHistory" 
      component={ShareHistoryScreen}
      options={{
        tabBarLabel: 'Share History',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="share-variant" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Doctor Stack Navigator
const DoctorStack = createStackNavigator();

const DoctorStackNavigator = () => (
  <DoctorStack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.textOnPrimary,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <DoctorStack.Screen
      name="ScanQR"
      component={ScanQRScreen}
      options={{ title: 'Scan QR Code' }}
    />
    <DoctorStack.Screen
      name="PatientRecords"
      component={PatientRecordsScreen}
      options={{ title: 'Patient Records' }}
    />
  </DoctorStack.Navigator>
);

// Doctor Tab Navigator
const DoctorTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
    }}
  >
    <Tab.Screen
      name="Scan"
      component={DoctorStackNavigator}
      options={{
        tabBarLabel: 'Scan QR',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="SavedPatients"
      component={SavedPatientsScreen}
      options={{
        tabBarLabel: 'Saved Patients',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-heart" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="AccessHistory"
      component={AccessHistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="history" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={DoctorProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Check auth periodically to catch state changes (e.g., after OTP verification)
    const interval = setInterval(() => {
      checkAuth();
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      const currentUser = await authService.getCurrentUser();
      
      // Always update state to ensure navigation updates properly
      setIsAuthenticated(authenticated);
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    // Return loading screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        // Enable back button on VerifyOTP screen
        gestureEnabled: true,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ gestureEnabled: true }}
          />
          <Stack.Screen 
            name="VerifyOTP" 
            component={VerifyOTPScreen}
            options={{ gestureEnabled: true }}
          />
        </>
      ) : user?.role === 'PATIENT' ? (
        <Stack.Screen name="PatientApp" component={PatientTabs} />
      ) : user?.role === 'DOCTOR' ? (
        <Stack.Screen name="DoctorApp" component={DoctorTabs} />
      ) : user?.role === 'SUPER_ADMIN' ? (
        <Stack.Screen name="AdminApp" component={AdminDashboardScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

