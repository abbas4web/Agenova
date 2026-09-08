import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/db';
import type { UserRow, UserPreferences } from '../types';
import { logger } from '../config/logger';

const SALT_ROUNDS = 12;

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
}

export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  defaultAgentId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  createdAt: Date;
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    preferences: row.preferences,
    createdAt: row.created_at,
  };
}

export class UserService {
  /**
   * Create a new user with a hashed password.
   * Throws if the email is already registered.
   */
  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const existing = await queryOne<UserRow>(
      'SELECT id FROM users WHERE email = $1',
      [input.email.toLowerCase()]
    );

    if (existing) {
      throw new Error('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const rows = await query<UserRow>(
      `INSERT INTO users (id, email, password_hash, display_name, preferences)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), input.email.toLowerCase(), passwordHash, input.displayName, JSON.stringify({})]
    );

    const user = rows[0];
    if (!user) throw new Error('Failed to create user.');

    logger.info({ userId: user.id }, 'User created');
    return toPublicUser(user);
  }

  /**
   * Verify credentials and return the user if valid.
   * Returns null on invalid credentials (never reveals which field is wrong).
   */
  async verifyCredentials(email: string, password: string): Promise<UserRow | null> {
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return user;
  }

  /** Find a user by ID. Returns null if not found. */
  async findById(userId: string): Promise<PublicUser | null> {
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return user ? toPublicUser(user) : null;
  }

  /** Find a user by email. Returns null if not found. */
  async findByEmail(email: string): Promise<PublicUser | null> {
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return user ? toPublicUser(user) : null;
  }

  /** Update user preferences (merged with existing). */
  async updatePreferences(
    userId: string,
    preferences: UpdatePreferencesInput
  ): Promise<PublicUser> {
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!user) throw new Error('User not found.');

    const merged: UserPreferences = {
      ...user.preferences,
      ...preferences,
    };

    const rows = await query<UserRow>(
      `UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(merged), userId]
    );

    const updated = rows[0];
    if (!updated) throw new Error('Failed to update preferences.');

    logger.info({ userId }, 'User preferences updated');
    return toPublicUser(updated);
  }

  /** Update display name. */
  async updateDisplayName(userId: string, displayName: string): Promise<PublicUser> {
    const rows = await query<UserRow>(
      `UPDATE users SET display_name = $1 WHERE id = $2 RETURNING *`,
      [displayName, userId]
    );

    const updated = rows[0];
    if (!updated) throw new Error('User not found.');

    logger.info({ userId }, 'Display name updated');
    return toPublicUser(updated);
  }

  /** Update password after verifying the current one. */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await queryOne<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!user) throw new Error('User not found.');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new Error('Current password is incorrect.');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    logger.info({ userId }, 'Password updated');
  }
}

export const userService = new UserService();
