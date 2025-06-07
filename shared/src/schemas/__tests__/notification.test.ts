import { NotificationSchema, NotificationPreferencesSchema } from '@schemas/notification';

describe('Notification Schemas', () => {
  describe('NotificationSchema', () => {
    it('should validate milestone notification', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        type: 'milestone' as const,
        title: 'Congratulations!',
        body: 'You have met the physical presence requirement!',
        data: {
          milestoneType: 'presence_requirement_met',
          achievedDate: '2024-06-15',
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = NotificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it('should validate warning notification', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        type: 'warning' as const,
        title: 'Long Trip Alert',
        body: 'Your current trip is approaching 180 days',
        data: {
          tripId: '789e4567-e89b-12d3-a456-426614174000',
          daysAbroad: 175,
        },
        read: true,
        createdAt: new Date().toISOString(),
      };

      const result = NotificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it('should validate reminder notification', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        type: 'reminder' as const,
        title: 'Travel Log Reminder',
        body: "Don't forget to log your recent trip",
        data: {
          reminderType: 'log_trip',
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = NotificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it('should validate celebration notification', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        type: 'celebration' as const,
        title: 'You can apply!',
        body: 'Your N-400 filing window is now open!',
        data: {
          celebrationType: 'filing_window_open',
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = NotificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it('should allow optional data field', () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        type: 'reminder' as const,
        title: 'General Reminder',
        body: 'Keep tracking your trips!',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = NotificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });
  });

  describe('NotificationPreferencesSchema', () => {
    it('should validate all preferences enabled', () => {
      const preferences = {
        milestones: true,
        warnings: true,
        reminders: true,
        celebrations: true,
      };

      const result = NotificationPreferencesSchema.safeParse(preferences);
      expect(result.success).toBe(true);
    });

    it('should validate selective preferences', () => {
      const preferences = {
        milestones: true,
        warnings: true,
        reminders: false,
        celebrations: false,
      };

      const result = NotificationPreferencesSchema.safeParse(preferences);
      expect(result.success).toBe(true);
    });

    it('should validate all preferences disabled', () => {
      const preferences = {
        milestones: false,
        warnings: false,
        reminders: false,
        celebrations: false,
      };

      const result = NotificationPreferencesSchema.safeParse(preferences);
      expect(result.success).toBe(true);
    });
  });
});
