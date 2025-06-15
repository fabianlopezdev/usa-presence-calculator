import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_ALIAS = 'usa-presence-db-key';
const _SALT_KEY_ALIAS = 'usa-presence-db-salt';

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initialize(): Promise<void> {
    try {
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
      
      if (!key) {
        key = await this.generateEncryptionKey();
        await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }

  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return btoa(String.fromCharCode(...new Uint8Array(randomBytes)));
  }

  async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const salt = await Crypto.getRandomBytesAsync(16);
      const saltStr = btoa(String.fromCharCode(...new Uint8Array(salt)));
      
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + this.encryptionKey + saltStr,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      
      return `${saltStr}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  decrypt(_encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    throw new Error('Decryption not implemented for this demo - in production, use proper AES encryption');
  }

  async encryptSensitiveFields<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: (keyof T)[]
  ): Promise<T> {
    const encrypted = { ...data };
    
    for (const field of sensitiveFields) {
      if (data[field] && typeof data[field] === 'string') {
        encrypted[field] = await this.encrypt(data[field] as string) as T[keyof T];
      }
    }
    
    return encrypted;
  }
}