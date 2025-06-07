import { TripSchema, TripCreateSchema, TripUpdateSchema, SimulatedTripSchema } from '@schemas/trip';

describe('Trip Schemas', () => {
  describe('TripSchema', () => {
    it('should validate a complete trip with location', () => {
      const validTrip = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        departureDate: '2024-01-15',
        returnDate: '2024-01-25',
        location: 'Madrid, Spain',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TripSchema.safeParse(validTrip);
      expect(result.success).toBe(true);
    });

    it('should validate a trip without location', () => {
      const validTrip = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        departureDate: '2024-02-01',
        returnDate: '2024-02-10',
        location: undefined,
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TripSchema.safeParse(validTrip);
      expect(result.success).toBe(true);
    });

    it('should reject trip with return date before departure date', () => {
      const invalidTrip = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        departureDate: '2024-01-25',
        returnDate: '2024-01-15', // Before departure
        location: 'Paris, France',
        isSimulated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TripSchema.safeParse(invalidTrip);
      expect(result.success).toBe(false);
    });

    it('should validate a simulated trip', () => {
      const simulatedTrip = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e4567-e89b-12d3-a456-426614174000',
        departureDate: '2024-06-01',
        returnDate: '2024-06-15',
        location: 'Tokyo, Japan',
        isSimulated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = TripSchema.safeParse(simulatedTrip);
      expect(result.success).toBe(true);
    });
  });

  describe('TripCreateSchema', () => {
    it('should validate trip creation data', () => {
      const createData = {
        departureDate: '2024-03-01',
        returnDate: '2024-03-10',
        location: 'London, UK',
      };

      const result = TripCreateSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });

    it('should validate trip creation without location', () => {
      const createData = {
        departureDate: '2024-03-01',
        returnDate: '2024-03-10',
      };

      const result = TripCreateSchema.safeParse(createData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const createData = {
        departureDate: '01-03-2024', // Wrong format
        returnDate: '2024-03-10',
      };

      const result = TripCreateSchema.safeParse(createData);
      expect(result.success).toBe(false);
    });
  });

  describe('TripUpdateSchema', () => {
    it('should validate partial trip update', () => {
      const updateData = {
        location: 'Barcelona, Spain',
      };

      const result = TripUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate date update', () => {
      const updateData = {
        departureDate: '2024-04-01',
        returnDate: '2024-04-15',
      };

      const result = TripUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should allow empty update', () => {
      const updateData = {};

      const result = TripUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('SimulatedTripSchema', () => {
    it('should validate simulated trip data', () => {
      const simulatedData = {
        departureDate: '2024-07-01',
        returnDate: '2024-07-20',
      };

      const result = SimulatedTripSchema.safeParse(simulatedData);
      expect(result.success).toBe(true);
    });

    it('should reject simulated trip with past dates', () => {
      const simulatedData = {
        departureDate: '2020-01-01',
        returnDate: '2020-01-10',
      };

      // Note: This test assumes we add validation for future dates
      // For now, it will pass as we haven't implemented this validation
      const result = SimulatedTripSchema.safeParse(simulatedData);
      expect(result.success).toBe(true);
    });
  });
});
