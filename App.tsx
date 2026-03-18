// App Entry Point — Sets up Redux Provider, checks auth, renders navigation
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './src/store';
import { checkAuth } from './src/store/slices/authSlice';
import { connectivityService } from './src/services/connectivityService';
import AppNavigator from './src/navigation/AppNavigator';
import NetworkBanner from './src/components/common/NetworkBanner';
import { Colors, Shadows } from './src/config/theme';

// ─── Inner App (needs Redux context) ────────────────────────────
function AppContent() {
  const dispatch = useAppDispatch();
  const { isCheckingAuth, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    // Start connectivity monitoring
    connectivityService.startMonitoring();

    // Check auth status
    dispatch(checkAuth());

    return () => {
      connectivityService.stopMonitoring();
    };
  }, [dispatch]);

  // Premium loading screen
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
        <View style={styles.loadingHeader} />
        <View style={styles.loadingContent}>
          <View style={styles.loadingLogo}>
            <Text style={styles.loadingLogoText}>M+</Text>
          </View>
          <ActivityIndicator size="large" color={Colors.primaryBlue} style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Loading your health dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={isAuthenticated ? 'dark-content' : 'light-content'}
        backgroundColor={isAuthenticated ? Colors.background : Colors.primaryBlue}
      />
      <AppNavigator isAuthenticated={isAuthenticated} />
      <NetworkBanner />
    </View>
  );
}

// ─── Root App (wraps with Provider) ─────────────────────────────
export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingHeader: {
    height: 200,
    backgroundColor: Colors.primaryBlue,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.elevated,
  },
  loadingLogoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryBlue,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.paragraph,
    fontWeight: '500',
  },
});
