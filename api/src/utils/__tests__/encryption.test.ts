import { describe, it, expect, beforeEach } from 'vitest';
import {
  EncryptionService,
  encryptField,
  decryptField,
  encryptSensitiveFields,
  decryptSensitiveFields,
} from '../encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testKey = 'test-key-that-is-at-least-32-characters-long-for-testing';

  beforeEach(() => {
    encryptionService = new EncryptionService(testKey);
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'This is sensitive data';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(encryptionService.encrypt('')).toBe('');
      expect(encryptionService.decrypt('')).toBe('');
    });

    it('should handle special characters and unicode', () => {
      const plaintext = 'Hello 👋 World! Special chars: @#$%^&*()_+';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'Same text';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => {
        encryptionService.decrypt('invalid-base64-data!@#$');
      }).toThrow('Failed to decrypt data');
    });

    it('should throw error when decrypting tampered data', () => {
      const plaintext = 'Original text';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with the encrypted data
      const tampered = `${encrypted.slice(0, -2)}XX`;

      expect(() => {
        encryptionService.decrypt(tampered);
      }).toThrow('Failed to decrypt data');
    });
  });

  describe('encryptFields/decryptFields', () => {
    it('should encrypt specified fields in an object', () => {
      const original = {
        id: '123',
        name: 'John Doe',
        location: 'New York',
        email: 'john@example.com',
        age: 30,
      };

      const fieldsToEncrypt = ['location', 'email'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted.id).toBe(original.id);
      expect(encrypted.name).toBe(original.name);
      expect(encrypted.age).toBe(original.age);
      expect(encrypted.location).not.toBe(original.location);
      expect(encrypted.email).not.toBe(original.email);

      const decrypted = encryptionService.decryptFields(encrypted, fieldsToEncrypt);
      expect(decrypted).toEqual(original);
    });

    it('should handle objects with missing fields', () => {
      const original = {
        id: '123',
        name: 'John Doe',
      };

      const fieldsToEncrypt = ['location', 'email', 'notes'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted).toEqual(original);
    });

    it('should only encrypt string fields', () => {
      const original = {
        id: 123,
        location: 'New York',
        data: { nested: 'value' },
        tags: ['tag1', 'tag2'],
      };

      const fieldsToEncrypt = ['id', 'location', 'data', 'tags'];
      const encrypted = encryptionService.encryptFields(original, fieldsToEncrypt);

      expect(encrypted.id).toBe(123); // Number not encrypted
      expect(encrypted.location).not.toBe(original.location); // String encrypted
      expect(encrypted.data).toEqual(original.data); // Object not encrypted
      expect(encrypted.tags).toEqual(original.tags); // Array not encrypted
    });
  });

  describe('helper functions', () => {
    it('should encrypt/decrypt using helper functions', () => {
      const plaintext = 'Test data';
      const encrypted = encryptField(plaintext);
      const decrypted = decryptField(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt/decrypt sensitive fields using default list', () => {
      const tripData = {
        id: '123',
        departureDate: '2024-01-01',
        returnDate: '2024-01-10',
        location: 'Paris, France',
        notes: 'Business trip with family',
        email: 'user@example.com',
      };

      const encrypted = encryptSensitiveFields(tripData);

      // Check that sensitive fields are encrypted
      expect(encrypted.location).not.toBe(tripData.location);
      expect(encrypted.notes).not.toBe(tripData.notes);
      expect(encrypted.email).not.toBe(tripData.email);

      // Check that non-sensitive fields are not encrypted
      expect(encrypted.id).toBe(tripData.id);
      expect(encrypted.departureDate).toBe(tripData.departureDate);
      expect(encrypted.returnDate).toBe(tripData.returnDate);

      const decrypted = decryptSensitiveFields(encrypted);
      expect(decrypted).toEqual(tripData);
    });
  });

  describe('security', () => {
    it('should not decrypt with different key', () => {
      const plaintext = 'Secret data';
      const encrypted = encryptionService.encrypt(plaintext);

      const differentService = new EncryptionService(
        'different-key-that-is-also-32-characters-long!!',
      );

      expect(() => {
        differentService.decrypt(encrypted);
      }).toThrow('Failed to decrypt data');
    });
  });

  describe('edge cases and performance', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      const encrypted = encryptionService.encrypt(longString);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(longString);
      expect(encrypted.length).toBeGreaterThan(longString.length);
    });

    it('should handle strings with only special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
      const encrypted = encryptionService.encrypt(specialChars);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle multi-line strings', () => {
      const multiLine = `Line 1
Line 2 with tabs\t\there
Line 3 with "quotes" and 'apostrophes'
Line 4 with unicode: 你好世界 🌍`;

      const encrypted = encryptionService.encrypt(multiLine);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(multiLine);
    });

    it('should handle null and undefined values gracefully', () => {
      const data = {
        id: '123',
        nullField: null,
        undefinedField: undefined,
        location: 'Test',
      };

      const fields = ['nullField', 'undefinedField', 'location'];
      const encrypted = encryptionService.encryptFields(data as Record<string, unknown>, fields);

      expect(encrypted.nullField).toBeNull();
      expect(encrypted.undefinedField).toBeUndefined();
      expect(encrypted.location).not.toBe('Test');
    });

    it('should handle deeply nested objects without encrypting them', () => {
      const nested = {
        user: {
          profile: {
            location: 'NYC',
            preferences: {
              notes: 'Private notes',
            },
          },
        },
        location: 'Top level location',
      };

      const encrypted = encryptionService.encryptFields(nested, ['location', 'notes']);

      expect(encrypted.location).not.toBe('Top level location');
      expect(encrypted.user.profile.location).toBe('NYC');
      expect(encrypted.user.profile.preferences.notes).toBe('Private notes');
    });

    it('should handle encryption with minimum viable key length', () => {
      const minKey = 'x'.repeat(32);
      const service = new EncryptionService(minKey);

      const plaintext = 'Test with minimum key';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle base64 edge cases', () => {
      const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]).toString();
      const encrypted = encryptionService.encrypt(binaryData);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(binaryData);
    });

    it('should handle concurrent encryption operations', async () => {
      const promises = Array(100)
        .fill(null)
        .map((_, i) => Promise.resolve(encryptionService.encrypt(`Data ${i}`)));

      const results = await Promise.all(promises);

      expect(new Set(results).size).toBe(100);

      const decryptPromises = results.map((encrypted) =>
        Promise.resolve(encryptionService.decrypt(encrypted)),
      );

      const decrypted = await Promise.all(decryptPromises);

      decrypted.forEach((result, i) => {
        expect(result).toBe(`Data ${i}`);
      });
    });

    it('should handle field names with special characters', () => {
      const data = {
        'field.with.dots': 'value1',
        'field[with]brackets': 'value2',
        'field with spaces': 'value3',
        normal: 'value4',
      };

      const fields = ['field.with.dots', 'field[with]brackets', 'field with spaces'];
      const encrypted = encryptionService.encryptFields(data, fields);

      expect(encrypted['field.with.dots']).not.toBe('value1');
      expect(encrypted['field[with]brackets']).not.toBe('value2');
      expect(encrypted['field with spaces']).not.toBe('value3');
      expect(encrypted.normal).toBe('value4');

      const decrypted = encryptionService.decryptFields(encrypted, fields);
      expect(decrypted).toEqual(data);
    });

    it('should handle consistent key derivation', () => {
      const key1 = 'test-key';
      const service1 = new EncryptionService(key1);
      const service2 = new EncryptionService(key1);

      const plaintext = 'Test data';
      const encrypted = service1.encrypt(plaintext);

      // Different service instances with same key should decrypt successfully
      const decrypted = service2.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle malformed encrypted data', () => {
      const malformedData = [
        'not-base64!',
        btoa('too-short'),
        btoa('x'.repeat(100)),
        'SGVsbG8gV29ybGQ=',
        '',
        ' ',
      ];

      malformedData.forEach((data) => {
        if (data && data.trim()) {
          expect(() => {
            encryptionService.decrypt(data);
          }).toThrow('Failed to decrypt data');
        }
      });
    });

    it('should maintain data integrity over multiple encrypt/decrypt cycles', () => {
      const originalData = {
        id: '123',
        location: 'Test Location',
        notes: 'Important notes with special chars: €£¥',
        email: 'test@example.com',
      };

      let data = { ...originalData };
      const fields = ['location', 'notes', 'email'];

      for (let i = 0; i < 10; i++) {
        data = encryptionService.encryptFields(data, fields);
        data = encryptionService.decryptFields(data, fields);
      }

      expect(data).toEqual(originalData);
    });

    it('should handle empty field arrays', () => {
      const data = { id: '123', name: 'Test' };
      const encrypted = encryptionService.encryptFields(data, []);

      expect(encrypted).toEqual(data);
    });

    it('should handle field arrays with non-existent fields', () => {
      const data = { id: '123', name: 'Test' };
      const fields = ['location', 'notes', 'email', 'nonexistent'];

      const encrypted = encryptionService.encryptFields(data, fields);
      expect(encrypted).toEqual(data);

      const decrypted = encryptionService.decryptFields(encrypted, fields);
      expect(decrypted).toEqual(data);
    });
  });
});
