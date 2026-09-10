import { PermissionsAndroid, Platform } from 'react-native';

// ─── Permission Service ───────────────────────────────────────────────────────

export type AppPermission = 'camera' | 'microphone' | 'storage' | 'notifications' | 'contacts';

export const permissionService = {
  request: async (permission: AppPermission): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS permissions are requested at runtime by system dialogs
      // Use react-native-permissions for fine-grained control
      console.log('[Permissions] iOS:', permission);
      return true;
    }

    const androidPermissionMap: Record<AppPermission, string | undefined> = {
      camera: PermissionsAndroid.PERMISSIONS.CAMERA,
      microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      storage: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      notifications: undefined, // handled via FCM on Android
      contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    };

    const androidPerm = androidPermissionMap[permission];
    if (!androidPerm) return true;

    const result = await PermissionsAndroid.request(androidPerm as Parameters<typeof PermissionsAndroid.request>[0]);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  },

  check: async (permission: AppPermission): Promise<boolean> => {
    if (Platform.OS === 'ios') return true;
    const androidPermissionMap: Record<AppPermission, string | undefined> = {
      camera: PermissionsAndroid.PERMISSIONS.CAMERA,
      microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      storage: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      notifications: undefined,
      contacts: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    };
    const androidPerm = androidPermissionMap[permission];
    if (!androidPerm) return true;
    return PermissionsAndroid.check(androidPerm as Parameters<typeof PermissionsAndroid.check>[0]);
  },
};
