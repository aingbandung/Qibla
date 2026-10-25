import { useState, useEffect, useCallback, useRef } from 'react';
import { soundService } from '../services/soundService';

export interface OrientationState {
  heading: number | null; // Compass heading in degrees 0-359.9 (0 = North)
  accuracy: number | null;
  isSupported: boolean;
  permissionGranted: boolean;
  needsPermission: boolean;
  isSimulated: boolean;
  isCalibrating: boolean;
}

export function useDeviceOrientation(qiblaBearing: number) {
  const [orientation, setOrientation] = useState<OrientationState>({
    heading: null,
    accuracy: null,
    isSupported: false,
    permissionGranted: false,
    needsPermission: false,
    isSimulated: false,
    isCalibrating: false,
  });

  const [simulatedHeading, setSimulatedHeading] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const prevAlignedRef = useRef<boolean>(false);

  // Check iOS permission requirements
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    const needsPermission = typeof DeviceOrientation?.requestPermission === 'function';

    setOrientation((prev) => ({
      ...prev,
      isSupported,
      needsPermission,
      permissionGranted: !needsPermission && isSupported,
    }));
  }, []);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async () => {
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientation?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        if (response === 'granted') {
          setOrientation((prev) => ({ ...prev, permissionGranted: true, needsPermission: false }));
          return true;
        } else {
          setOrientation((prev) => ({ ...prev, permissionGranted: false }));
          return false;
        }
      } catch (err) {
        console.error('Error requesting orientation permission', err);
        return false;
      }
    }
    return true;
  }, []);

  // Listen to orientation events
  useEffect(() => {
    if (isManualMode) return;
    if (orientation.needsPermission && !orientation.permissionGranted) return;

    let hasReceivedValidData = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;

      // iOS WebKit compass heading (directly provides accurate compass 0-360)
      const webkitEvent = e as DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
      if (typeof webkitEvent.webkitCompassHeading === 'number' && !isNaN(webkitEvent.webkitCompassHeading)) {
        compassHeading = webkitEvent.webkitCompassHeading;
      } else if (e.alpha !== null && !isNaN(e.alpha)) {
        // Standard Android / Web standard (alpha: rotation around z axis)
        // For standard compass heading: 360 - alpha
        compassHeading = (360 - e.alpha) % 360;
      }

      if (compassHeading !== null) {
        hasReceivedValidData = true;
        const normalized = (compassHeading + 360) % 360;
        setOrientation((prev) => ({
          ...prev,
          heading: normalized,
          accuracy: webkitEvent.webkitCompassAccuracy ?? null,
          isSimulated: false,
        }));
      }
    };

    // Prefer deviceorientationabsolute if available (Android Chrome for true magnetic orientation)
    const win = window as unknown as Record<string, unknown>;
    const hasAbsolute = 'ondeviceorientationabsolute' in win;
    const hasStandard = 'ondeviceorientation' in win;

    if (hasAbsolute) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    } else if (hasStandard) {
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    }

    // Fallback: If no real hardware event received after 2.5s (e.g. desktop/laptop), enable simulated mode gracefully
    const fallbackTimer = setTimeout(() => {
      if (!hasReceivedValidData) {
        setIsManualMode(true);
        setOrientation((prev) => ({
          ...prev,
          heading: 0,
          isSimulated: true,
        }));
      }
    }, 2500);

    return () => {
      clearTimeout(fallbackTimer);
      if (hasAbsolute) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      }
      if (hasStandard) {
        window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      }
    };
  }, [orientation.needsPermission, orientation.permissionGranted, isManualMode]);

  // Current effective heading
  const currentHeading = isManualMode ? simulatedHeading : orientation.heading ?? 0;

  // Relative angle to Qibla: how many degrees device needs to turn to face Qibla
  // If positive: turn right; if negative: turn left
  let diff = qiblaBearing - currentHeading;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  // Is facing Kaaba within tolerance (±3 degrees)
  const isFacingQibla = Math.abs(diff) <= 3.5;

  // Trigger feedback when transitioning into alignment
  useEffect(() => {
    if (isFacingQibla && !prevAlignedRef.current) {
      soundService.playAlignmentHaptic();
    }
    prevAlignedRef.current = isFacingQibla;
  }, [isFacingQibla]);

  return {
    ...orientation,
    currentHeading,
    relativeAngle: diff,
    isFacingQibla,
    isManualMode,
    setIsManualMode,
    simulatedHeading,
    setSimulatedHeading,
    requestPermission,
  };
}
