import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Production-ready permission handling utility
 * Follows iOS HIG and Android Material Design guidelines for permission requests
 */

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  RESTRICTED: 'restricted'
};

/**
 * Check current permission status without requesting
 */
export const checkCameraPermission = async () => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return PermissionStatus.DENIED;
  }
};

export const checkMediaLibraryPermission = async () => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking media library permission:', error);
    return PermissionStatus.DENIED;
  }
};

/**
 * Request permissions with proper user education
 * Shows explanatory dialog before system permission prompt
 */
export const requestCameraPermissionWithEducation = async (context = 'take photos') => {
  try {
    const currentStatus = await checkCameraPermission();
    
    if (currentStatus === PermissionStatus.GRANTED) {
      return true;
    }

    if (currentStatus === PermissionStatus.DENIED) {
      // Permission was previously denied, show settings dialog
      return showPermissionSettingsDialog('Camera', 'camera');
    }

    // First time asking - show educational dialog
    return new Promise((resolve) => {
      Alert.alert(
        'Camera Access Required',
        `BillBuddy needs camera access to ${context}. This helps you capture receipts and update your profile picture.`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow Camera',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              resolve(status === PermissionStatus.GRANTED);
            },
          },
        ],
        { cancelable: false }
      );
    });
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const requestMediaLibraryPermissionWithEducation = async (context = 'select photos') => {
  try {
    const currentStatus = await checkMediaLibraryPermission();
    
    if (currentStatus === PermissionStatus.GRANTED) {
      return true;
    }

    if (currentStatus === PermissionStatus.DENIED) {
      return showPermissionSettingsDialog('Photo Library', 'photos');
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Photo Library Access Required',
        `BillBuddy needs photo library access to ${context}. This helps you attach receipt images and update your profile.`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow Photos',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              resolve(status === PermissionStatus.GRANTED);
            },
          },
        ],
        { cancelable: false }
      );
    });
  } catch (error) {
    console.error('Error requesting media library permission:', error);
    return false;
  }
};

/**
 * Show dialog directing user to settings when permission is denied
 */
const showPermissionSettingsDialog = (permissionType, feature) => {
  return new Promise((resolve) => {
    Alert.alert(
      `${permissionType} Permission Denied`,
      `To use ${feature} features, please enable ${permissionType} access in Settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
            resolve(false);
          },
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * Request both permissions for full image functionality
 */
export const requestImagePermissionsWithEducation = async (context = 'manage photos') => {
  try {
    const cameraGranted = await requestCameraPermissionWithEducation(context);
    const libraryGranted = await requestMediaLibraryPermissionWithEducation(context);
    
    return { cameraGranted, libraryGranted };
  } catch (error) {
    console.error('Error requesting image permissions:', error);
    return { cameraGranted: false, libraryGranted: false };
  }
};

/**
 * Quick permission check for immediate use (after initial education)
 */
export const checkImagePermissions = async () => {
  try {
    const cameraStatus = await checkCameraPermission();
    const libraryStatus = await checkMediaLibraryPermission();
    
    return {
      camera: cameraStatus === PermissionStatus.GRANTED,
      library: libraryStatus === PermissionStatus.GRANTED,
      both: cameraStatus === PermissionStatus.GRANTED && libraryStatus === PermissionStatus.GRANTED
    };
  } catch (error) {
    console.error('Error checking image permissions:', error);
    return { camera: false, library: false, both: false };
  }
};