import { BusinessVerification, VerificationAuditEvent, VerificationLevel, VerificationStatus } from './types';

/**
 * Sampark V1 Business Verification State Machine
 * Decoupled, production-ready verification logic.
 */

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validates whether GPS device coordinates fall within the maximum allowable geofence radius (e.g. 50 meters).
 */
export function evaluateGeofence(
  storeLat: number,
  storeLng: number,
  deviceLat: number,
  deviceLng: number,
  accuracyMeters: number = 20,
  maxRadiusMeters: number = 60
): { passed: boolean; distanceMeters: number; reason?: string } {
  if (accuracyMeters > 100) {
    return {
      passed: false,
      distanceMeters: 0,
      reason: `GPS accuracy too low (${Math.round(accuracyMeters)}m). Must be under 100m.`,
    };
  }

  const distance = calculateDistanceMeters(storeLat, storeLng, deviceLat, deviceLng);
  if (distance <= maxRadiusMeters) {
    return { passed: true, distanceMeters: distance };
  } else {
    return {
      passed: false,
      distanceMeters: distance,
      reason: `Device is ${distance}m away from registered store address (Limit: ${maxRadiusMeters}m).`,
    };
  }
}

/**
 * Validates Indian GSTIN format (15 characters: 2 state code + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
 */
export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(clean);
}

/**
 * State machine: determines Verification Level & Status based on satisfied tiers
 */
export function transitionVerificationState(
  current: BusinessVerification,
  auditEvent: VerificationAuditEvent
): BusinessVerification {
  const updatedHistory = [auditEvent, ...(current.auditHistory || [])];

  let mobileVerified = current.mobileVerified;
  let mobileVerifiedAt = current.mobileVerifiedAt;
  let locationVerified = current.locationVerified;
  let locationVerifiedAt = current.locationVerifiedAt;
  let businessDocVerified = current.businessDocVerified;
  let businessDocVerifiedAt = current.businessDocVerifiedAt;

  if (auditEvent.eventType === 'mobile_otp' && auditEvent.status === 'passed') {
    mobileVerified = true;
    mobileVerifiedAt = auditEvent.timestamp;
  }

  if (auditEvent.eventType === 'gps_geofence' && auditEvent.status === 'passed') {
    locationVerified = true;
    locationVerifiedAt = auditEvent.timestamp;
  }

  if (auditEvent.eventType === 'gst_doc' && auditEvent.status === 'passed') {
    businessDocVerified = true;
    businessDocVerifiedAt = auditEvent.timestamp;
  }

  // Calculate Verification Level
  let level: VerificationLevel = 0;
  if (mobileVerified) level = 1;
  if (mobileVerified && locationVerified) level = 2;
  if (mobileVerified && locationVerified && businessDocVerified) level = 3;

  // Calculate Verification Status
  let status: VerificationStatus = 'draft';
  if (level === 0) status = 'draft';
  else if (level < 3) status = 'pending_verification';
  else status = 'verified';

  // Next audit due in 180 days
  const nextAudit = new Date();
  nextAudit.setDate(nextAudit.getDate() + 180);

  return {
    ...current,
    level,
    status,
    mobileVerified,
    mobileVerifiedAt,
    locationVerified,
    locationVerifiedAt,
    businessDocVerified,
    businessDocVerifiedAt,
    lastVerifiedDate: new Date().toISOString(),
    nextVerificationDueAt: nextAudit.toISOString(),
    reverificationRequired: false,
    auditHistory: updatedHistory,
  };
}
