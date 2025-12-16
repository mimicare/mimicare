import { type CountryCode } from '@mimicare/schema';

export interface JwtPayload {
  userId: string;
  role: string;
  email?: string; // Optional for refresh tokens
}

/**
 * Access-token payload with stateful session binding.
 * sessionId is the RefreshToken table row ID (CUID).
 */
export interface StatefulJwtPayload extends JwtPayload {
  sessionId: string;
}

export interface JwtPayloadWithRt extends JwtPayload {
  refreshToken: string;
  deviceId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    countryCode: CountryCode | null;
    role: string;
    isVerified: boolean;
    profilePictureUrl: string | null;
  };
  deviceId: string;
  expiresIn: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GoogleUserData {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  picture?: string;
  deviceName?: string;
}

export interface PhoneAuthData {
  phoneNumber: string;
  countryCode: CountryCode;
  deviceName: string;
}
