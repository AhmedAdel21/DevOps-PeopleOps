import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { attendanceLog } from '@/core/logger';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationErrorReason = 'permission-denied' | 'unavailable' | 'timeout';

export class LocationError extends Error {
  constructor(public readonly reason: LocationErrorReason, message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

const POSITION_TIMEOUT_MS = 15_000;
const MAXIMUM_AGE_MS = 10_000;

async function ensureForegroundPermission(): Promise<void> {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    if (status === 'granted') return;
    throw new LocationError(
      'permission-denied',
      `iOS location authorization not granted (status=${status})`,
    );
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) return;
    throw new LocationError(
      'permission-denied',
      `Android ACCESS_FINE_LOCATION not granted (result=${granted})`,
    );
  }
}

/**
 * Requests foreground location permission (if not already granted) and returns
 * the device's current coordinates. Used by attendance sign-in / sign-out so
 * the backend can record where the action happened.
 *
 * Throws a typed `LocationError` for the three failure modes the caller cares
 * about:
 *   - `permission-denied`: user declined the OS prompt.
 *   - `unavailable`: GPS / location services are off, or no provider responded.
 *   - `timeout`: provider didn't respond within `POSITION_TIMEOUT_MS`.
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  attendanceLog.info('data_source', 'getCurrentLocation: requesting permission');
  await ensureForegroundPermission();

  return new Promise<Coordinates>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        attendanceLog.info(
          'data_source',
          `getCurrentLocation: ok (lat=${latitude.toFixed(5)}, lng=${longitude.toFixed(5)})`,
        );
        resolve({ latitude, longitude });
      },
      (err) => {
        // react-native-geolocation-service error codes:
        //   1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        const reason: LocationErrorReason =
          err.code === 1
            ? 'permission-denied'
            : err.code === 3
              ? 'timeout'
              : 'unavailable';
        attendanceLog.warn(
          'data_source',
          `getCurrentLocation: failed (code=${err.code}, reason=${reason}, msg=${err.message})`,
        );
        reject(new LocationError(reason, err.message ?? 'Failed to read location'));
      },
      {
        enableHighAccuracy: true,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: MAXIMUM_AGE_MS,
      },
    );
  });
}
