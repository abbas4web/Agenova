import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types';
import { userService } from './UserService';
import type { PublicUser } from './UserService';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export interface RegisterResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  /**
   * Register a new user and return a signed JWT.
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<RegisterResult> {
    const user = await userService.createUser({ email, password, displayName });
    const token = this.signToken({ userId: user.id, email: user.email });
    return { token, user };
  }

  /**
   * Validate credentials and return a signed JWT.
   * Throws on invalid credentials.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const userRow = await userService.verifyCredentials(email, password);
    if (!userRow) {
      throw new Error('Invalid email or password.');
    }

    const user = await userService.findById(userRow.id);
    if (!user) throw new Error('User not found.');

    const token = this.signToken({ userId: user.id, email: user.email });
    return { token, user };
  }

  /**
   * Verify a JWT and return the decoded payload.
   * Throws on invalid or expired tokens.
   */
  verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    return decoded;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
