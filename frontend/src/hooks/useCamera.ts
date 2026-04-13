import { useEffect, useState } from 'react';
import { useCameraPermissions } from 'expo-camera';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UseCameraReturn {
  permissionStatus: PermissionStatus;
  requestPermission: () => Promise<void>;
}

export function useCamera(): UseCameraReturn {
  const [permission, requestPermissionFn] = useCameraPermissions();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>('undetermined');

  useEffect(() => {
    if (!permission) return;
    if (permission.granted) {
      setPermissionStatus('granted');
    } else if (permission.canAskAgain === false) {
      setPermissionStatus('denied');
    } else {
      setPermissionStatus('undetermined');
    }
  }, [permission]);

  const requestPermission = async () => {
    const result = await requestPermissionFn();
    if (result.granted) {
      setPermissionStatus('granted');
    } else {
      setPermissionStatus('denied');
    }
  };

  return { permissionStatus, requestPermission };
}
