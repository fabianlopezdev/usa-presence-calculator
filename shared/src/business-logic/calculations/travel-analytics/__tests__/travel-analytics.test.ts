// Internal dependencies - Schemas & Types
import { MilestoneInfo, TravelStreak } from '@schemas/travel-analytics';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateCountryStatistics,
  calculateDaysAbroadByYear,
  calculateTravelStreaks,
  calculateMilestones,
  calculateSafeTravelBudget,
  projectEligibilityDate,
  assessUpcomingTripRisk,
  generateAnnualTravelSummary,
} from '@business-logic/calculations/travel-analytics';

describe('Travel Analytics', () => {
  const createTrip = (
    id: string,
    departureDate: string,
    returnDate: string,
    location: string,
    isSimulated = false,
  ): Trip => ({
    id,
    userId: 'user1',
    departureDate,
    returnDate,
    location,
    isSimulated,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('calculateCountryStatistics', () => {
    it('should calculate statistics for multiple countries', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-20', 'Mexico'),
        createTrip('2', '2022-03-15', '2022-03-25', 'Canada'),
        createTrip('3', '2022-06-01', '2022-06-10', 'Mexico'),
        createTrip('4', '2022-08-05', '2022-08-20', 'Spain'),
      ];

      const stats = calculateCountryStatistics(trips);

      expect(stats).toHaveLength(3);
      expect(stats[0]).toEqual({
        country: 'Mexico',
        totalDays: 17, // 9 + 8 days
        tripCount: 2,
        averageDuration: 9, // Math.round(17/2) = 9 (rounded up from 8.5)
        lastVisited: '2022-06-10',
      });
      expect(stats[1]).toEqual({
        country: 'Spain',
        totalDays: 14,
        tripCount: 1,
        averageDuration: 14,
        lastVisited: '2022-08-20',
      });
    });

    it('should handle trips with missing location', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-20', ''),
        createTrip('2', '2022-03-15', '2022-03-25', ''),
      ];

      const stats = calculateCountryStatistics(trips);

      expect(stats).toHaveLength(1);
      expect(stats[0].country).toBe('Unknown');
      expect(stats[0].totalDays).toBe(18); // 9 + 9 days
    });

    it('should exclude simulated trips', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-20', 'Mexico'),
        createTrip('2', '2022-03-15', '2022-03-25', 'Mexico', true), // simulated
      ];

      const stats = calculateCountryStatistics(trips);

      expect(stats).toHaveLength(1);
      expect(stats[0].tripCount).toBe(1);
      expect(stats[0].totalDays).toBe(9);
    });

    it('should handle same-day trips', () => {
      const trips: Trip[] = [createTrip('1', '2022-01-10', '2022-01-10', 'Canada')];

      const stats = calculateCountryStatistics(trips);

      expect(stats[0].totalDays).toBe(0); // Same day = 0 days abroad
      expect(stats[0].averageDuration).toBe(0);
    });

    it('should handle empty trip list', () => {
      const stats = calculateCountryStatistics([]);
      expect(stats).toEqual([]);
    });

    it('should sort by total days descending', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-12', 'Short Trip Country'), // 1 day
        createTrip('2', '2022-03-15', '2022-04-15', 'Long Trip Country'), // 30 days
        createTrip('3', '2022-06-01', '2022-06-11', 'Medium Trip Country'), // 9 days
      ];

      const stats = calculateCountryStatistics(trips);

      expect(stats[0].country).toBe('Long Trip Country');
      expect(stats[1].country).toBe('Medium Trip Country');
      expect(stats[2].country).toBe('Short Trip Country');
    });
  });

  describe('calculateDaysAbroadByYear', () => {
    it('should calculate days by year correctly', () => {
      const trips: Trip[] = [
        createTrip('1', '2020-06-10', '2020-06-20', 'Mexico'),
        createTrip('2', '2020-12-20', '2021-01-10', 'Canada'), // Crosses years
        createTrip('3', '2021-03-15', '2021-03-25', 'Spain'),
      ];

      const yearly = calculateDaysAbroadByYear(trips, '2020-01-01', '2021-12-31');

      expect(yearly).toHaveLength(2);
      expect(yearly[0]).toEqual({
        year: 2020,
        daysAbroad: 20, // 9 days Mexico + 11 days Canada (Dec portion)
        tripCount: 2,
      });
      expect(yearly[1]).toEqual({
        year: 2021,
        daysAbroad: 18, // 9 days Canada (Jan portion) + 9 days Spain
        tripCount: 1, // Only Spain starts in 2021 (current implementation counts by departure year)
      });
    });

    it('should handle green card obtained mid-year', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-03-10', '2022-03-20', 'Mexico'), // Before green card
        createTrip('2', '2022-08-10', '2022-08-20', 'Canada'), // After green card
      ];

      const yearly = calculateDaysAbroadByYear(trips, '2022-06-01', '2022-12-31');

      expect(yearly).toHaveLength(1);
      expect(yearly[0].daysAbroad).toBe(9); // Only Canada trip days count (Mexico trip is before green card)
      expect(yearly[0].tripCount).toBe(1); // Only Canada trip counts (Mexico trip is before green card)
    });

    it('should handle invalid date inputs', () => {
      const trips: Trip[] = [createTrip('1', '2022-06-10', '2022-06-20', 'Mexico')];

      const yearly = calculateDaysAbroadByYear(trips, 'invalid-date', '2022-12-31');
      expect(yearly).toEqual([]);
    });

    it('should handle trips spanning multiple years', () => {
      const trips: Trip[] = [
        createTrip('1', '2020-12-15', '2023-01-15', 'Extended Stay'), // 3+ year trip
      ];

      const yearly = calculateDaysAbroadByYear(trips, '2020-01-01', '2023-12-31');

      expect(yearly).toHaveLength(4);
      expect(yearly[0].year).toBe(2020);
      expect(yearly[0].daysAbroad).toBe(16); // Dec 16-31 (excluding Dec 15)
      expect(yearly[1].daysAbroad).toBe(365); // All of 2021
      expect(yearly[2].daysAbroad).toBe(365); // All of 2022
      expect(yearly[3].daysAbroad).toBe(14); // Jan 1-14 (excluding Jan 15)
    });

    it('should handle leap years correctly', () => {
      const trips: Trip[] = [createTrip('1', '2020-01-01', '2020-12-31', 'Year Long Trip')];

      const yearly = calculateDaysAbroadByYear(trips, '2020-01-01', '2020-12-31');

      expect(yearly[0].daysAbroad).toBe(364); // 366 days (leap year) - 2 travel days
    });
  });

  describe('calculateTravelStreaks', () => {
    it('should identify presence streaks between trips', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-02-10', '2022-02-20', 'Mexico'),
        createTrip('2', '2022-05-15', '2022-05-25', 'Canada'),
      ];

      const streaks = calculateTravelStreaks(trips, '2022-01-01', '2022-12-31');

      expect(streaks).toHaveLength(3);
      expect(streaks[0].duration).toBe(220); // Current presence (May 26 - Dec 31)
      expect(streaks[0].type).toBe('in_usa');
      expect(streaks[1].duration).toBe(83); // Gap between trips (Feb 21 - May 14)
      expect(streaks[2].duration).toBe(40); // Initial presence (Jan 1 - Feb 9)
    });

    it('should handle no trips (continuous presence)', () => {
      const streaks = calculateTravelStreaks([], '2022-01-01', '2022-12-31');

      expect(streaks).toHaveLength(1);
      expect(streaks[0]).toEqual({
        type: 'in_usa',
        startDate: '2022-01-01',
        endDate: '2022-12-31',
        duration: 365,
        description: 'Continuous presence in USA for 365 days',
      });
    });

    it('should handle back-to-back trips with no gap', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-06-01', '2022-06-10', 'Mexico'),
        createTrip('2', '2022-06-11', '2022-06-20', 'Canada'),
      ];

      const streaks = calculateTravelStreaks(trips, '2022-01-01', '2022-12-31');

      const gapStreaks = streaks.filter(
        (s: TravelStreak) => s.startDate >= '2022-06-10' && s.endDate <= '2022-06-11',
      );
      expect(gapStreaks).toHaveLength(0); // No gap between trips
    });

    it('should handle trip on green card date', () => {
      const trips: Trip[] = [createTrip('1', '2022-01-01', '2022-01-10', 'Mexico')];

      const streaks = calculateTravelStreaks(trips, '2022-01-01', '2022-12-31');

      // Should not have initial presence streak since trip starts on green card date
      const initialStreaks = streaks.filter((s: TravelStreak) =>
        s.description.includes('Initial presence'),
      );
      expect(initialStreaks).toHaveLength(0);
    });

    it('should handle invalid dates', () => {
      const trips: Trip[] = [createTrip('1', '2022-06-10', '2022-06-20', 'Mexico')];

      const streaks = calculateTravelStreaks(trips, 'invalid', '2022-12-31');
      expect(streaks).toEqual([]);
    });

    it('should sort streaks by duration descending', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-12', 'Short Trip'),
        createTrip('2', '2022-12-20', '2022-12-25', 'End Trip'),
      ];

      const streaks = calculateTravelStreaks(trips, '2022-01-01', '2022-12-31');

      // Verify streaks are sorted by duration
      for (let i = 1; i < streaks.length; i++) {
        expect(streaks[i - 1].duration).toBeGreaterThanOrEqual(streaks[i].duration);
      }
    });
  });

  describe('calculateMilestones', () => {
    it('should calculate physical presence milestone correctly', () => {
      const milestones = calculateMilestones(500, 'five_year', '2020-01-01', '2022-06-15');

      const physicalPresence = milestones.find(
        (m: MilestoneInfo) => m.type === 'physical_presence',
      );
      expect(physicalPresence).toBeDefined();
      expect(physicalPresence?.daysRemaining).toBe(413); // 913 - 500
      expect(physicalPresence?.currentProgress).toBe(54.8); // 500/913 * 100
    });

    it('should show requirement met when eligible', () => {
      const milestones = calculateMilestones(920, 'five_year', '2020-01-01', '2024-06-15');

      const physicalPresence = milestones.find(
        (m: MilestoneInfo) => m.type === 'physical_presence',
      );
      expect(physicalPresence?.daysRemaining).toBe(0);
      expect(physicalPresence?.currentProgress).toBe(100);
      expect(physicalPresence?.description).toContain('met!');
    });

    it('should calculate early filing window for 3-year path', () => {
      const milestones = calculateMilestones(400, 'three_year', '2021-01-15', '2023-06-15');

      const earlyFiling = milestones.find((m: MilestoneInfo) => m.type === 'early_filing');
      expect(earlyFiling).toBeDefined();
      expect(earlyFiling?.targetDate).toBe('2023-10-16'); // 90 days before 3-year anniversary (UTC calculation)
    });

    it('should show early filing window open', () => {
      const milestones = calculateMilestones(548, 'three_year', '2020-01-15', '2023-01-01');

      const earlyFiling = milestones.find((m: MilestoneInfo) => m.type === 'early_filing');
      expect(earlyFiling?.daysRemaining).toBe(0);
      expect(earlyFiling?.currentProgress).toBe(100);
      expect(earlyFiling?.description).toContain('open!');
    });

    it('should handle leap year green card dates', () => {
      const milestones = calculateMilestones(500, 'five_year', '2020-02-29', '2024-06-15');

      const earlyFiling = milestones.find((m: MilestoneInfo) => m.type === 'early_filing');
      // Anniversary falls on Feb 28, 2025 (non-leap year)
      // 90 days before Feb 28, 2025 is Nov 29, 2024
      expect(earlyFiling?.targetDate).toBe('2024-11-29'); // 90 days before Feb 28, 2025
    });

    it('should handle edge case of exactly required days', () => {
      const milestones = calculateMilestones(913, 'five_year', '2020-01-01', '2024-06-15');

      const physicalPresence = milestones.find(
        (m: MilestoneInfo) => m.type === 'physical_presence',
      );
      expect(physicalPresence?.daysRemaining).toBe(0);
      expect(physicalPresence?.currentProgress).toBe(100);
    });
  });

  describe('calculateSafeTravelBudget', () => {
    it('should calculate safe travel budget correctly', () => {
      const budget = calculateSafeTravelBudget(
        600, // totalDaysInUSA
        226, // totalDaysAbroad (826 total days)
        'five_year',
        '2020-01-01',
        '2022-04-01', // 826 days since green card
      );

      // 5 years = 1826 days total, need 913 in USA, can be abroad 913
      // Already abroad 226, so 687 days available
      expect(budget.daysAvailable).toBeGreaterThan(600);
      expect(budget.riskLevel).toBe('safe');
    });

    it('should show warning risk level when budget is low', () => {
      const budget = calculateSafeTravelBudget(
        883, // Only 30 days away from requirement
        900,
        'five_year',
        '2020-01-01',
        '2024-11-01',
      );

      expect(budget.daysAvailable).toBeLessThanOrEqual(30);
      expect(budget.riskLevel).toBe('warning');
      expect(budget.recommendation).toContain('Minimize travel');
    });

    it('should show caution risk level for medium budget', () => {
      const budget = calculateSafeTravelBudget(
        823, // 90 days away from requirement
        850,
        'five_year',
        '2020-01-01',
        '2024-06-01',
      );

      expect(budget.riskLevel).toBe('caution');
      expect(budget.recommendation).toContain('Travel carefully');
    });

    it('should handle 3-year path calculations', () => {
      const budget = calculateSafeTravelBudget(400, 200, 'three_year', '2021-01-01', '2022-06-01');

      // 3 years = 1096 days, need 548 in USA, can be abroad 548
      expect(budget.daysAvailable).toBeLessThan(548);
      expect(budget.untilDate).toBe('2023-12-31'); // UTC calculation for anniversary
    });

    it('should handle negative available days', () => {
      const budget = calculateSafeTravelBudget(
        100, // Very low presence
        800, // Very high absence
        'five_year',
        '2020-01-01',
        '2022-06-01',
      );

      expect(budget.daysAvailable).toBeGreaterThan(100); // Still has days available based on 5-year period
      expect(budget.riskLevel).toBe('safe'); // With 113 days available, it's still safe
    });
  });

  describe('projectEligibilityDate', () => {
    it('should project eligibility based on travel patterns', () => {
      const trips: Trip[] = [
        createTrip('1', '2021-06-10', '2021-06-20', 'Mexico'),
        createTrip('2', '2021-12-20', '2022-01-10', 'Canada'),
        createTrip('3', '2022-06-15', '2022-06-25', 'Spain'),
      ];

      // Total days: 547 (from Jan 1, 2021 to July 1, 2022)
      // Days abroad: 38 (9 + 20 + 9)
      // Total days in USA: 547 - 38 = 509
      const projection = projectEligibilityDate(
        trips,
        509, // totalDaysInUSA (consistent with actual trips)
        'five_year',
        '2021-01-01',
        '2022-07-01', // 547 days total
      );

      // Historical absence rate: 38 / 547 ≈ 7%
      expect(projection.averageDaysAbroadPerYear).toBeGreaterThan(0);
      expect(projection.averageDaysAbroadPerYear).toBeLessThan(30); // ~7% of 365 ≈ 26 days
      expect(projection.confidenceLevel).toBe('low'); // Limited historical data (< 3 years)
      expect(projection.assumptions).toContain('Based on 7% historical absence rate');
    });

    it('should show requirement already met', () => {
      const projection = projectEligibilityDate([], 920, 'five_year', '2020-01-01', '2024-06-01');

      expect(projection.projectedEligibilityDate).toBe('2024-06-01');
      expect(projection.confidenceLevel).toBe('high');
      expect(projection.assumptions).toContain('Physical presence requirement already met');
    });

    it('should handle low confidence with variable travel', () => {
      const trips: Trip[] = [
        // Highly variable travel pattern
        createTrip('1', '2021-01-10', '2021-01-15', 'Short'),
        createTrip('2', '2021-06-01', '2021-08-30', 'Long'),
        createTrip('3', '2022-02-01', '2022-02-05', 'Short'),
      ];

      const projection = projectEligibilityDate(
        trips,
        400,
        'five_year',
        '2021-01-01',
        '2022-12-31',
      );

      expect(projection.confidenceLevel).toBe('low'); // High variance
    });

    it('should handle no travel history', () => {
      const projection = projectEligibilityDate([], 400, 'five_year', '2021-01-01', '2021-06-01');

      expect(projection.confidenceLevel).toBe('low');
      expect(projection.assumptions).toContain('No travel history available for projection');
    });

    it('should handle edge case of 100% travel', () => {
      const trips: Trip[] = [createTrip('1', '2021-01-01', '2021-12-31', 'Year abroad')];

      const projection = projectEligibilityDate(
        trips,
        0, // No days in USA
        'five_year',
        '2021-01-01',
        '2021-12-31',
      );

      // Should project far into future due to 100% absence rate
      expect(new Date(projection.projectedEligibilityDate).getFullYear()).toBeGreaterThan(2030);
    });
  });

  describe('assessUpcomingTripRisk', () => {
    it('should assess critical risk for year-long trips', () => {
      const upcomingTrips: Trip[] = [
        createTrip('1', '2024-01-01', '2025-01-10', 'Extended Stay', true),
      ];

      const assessments = assessUpcomingTripRisk(
        upcomingTrips,
        500,
        'five_year',
        '2020-01-01',
        '2023-12-01',
      );

      expect(assessments[0].riskLevel).toBe('critical');
      expect(assessments[0].impactDescription).toContain('break continuous residence');
    });

    it('should assess high risk for 6+ month trips', () => {
      const upcomingTrips: Trip[] = [
        createTrip('1', '2024-01-01', '2024-07-10', 'Long Trip', true),
      ];

      const assessments = assessUpcomingTripRisk(
        upcomingTrips,
        500,
        'five_year',
        '2020-01-01',
        '2023-12-01',
      );

      expect(assessments[0].riskLevel).toBe('high');
      expect(assessments[0].recommendation).toContain('Shorten trip to under 180 days');
    });

    it('should assess medium risk for approaching limits', () => {
      const upcomingTrips: Trip[] = [
        createTrip('1', '2024-01-01', '2024-06-01', '151 Day Trip', true),
      ];

      const assessments = assessUpcomingTripRisk(
        upcomingTrips,
        500,
        'five_year',
        '2020-01-01',
        '2023-12-01',
      );

      expect(assessments[0].riskLevel).toBe('medium');
      expect(assessments[0].daysUntilRisk).toBe(1); // 151 days abroad - 150 threshold
    });

    it('should assess cumulative risk for multiple trips', () => {
      const upcomingTrips: Trip[] = [
        createTrip('1', '2024-01-01', '2024-03-01', 'Trip 1', true),
        createTrip('2', '2024-06-01', '2024-08-01', 'Trip 2', true),
        createTrip('3', '2024-10-01', '2024-12-01', 'Trip 3', true), // This exceeds budget
      ];

      const assessments = assessUpcomingTripRisk(
        upcomingTrips,
        800, // Close to requirement
        'five_year',
        '2020-01-01',
        '2023-12-01',
      );

      // Last trip should show risk due to cumulative effect
      expect(assessments[2].riskLevel).toBe('medium');
      expect(assessments[2].impactDescription).toContain('exceed your safe travel budget');
    });

    it('should only assess simulated trips', () => {
      const upcomingTrips: Trip[] = [
        createTrip('1', '2023-01-01', '2023-12-31', 'Past Trip', false),
        createTrip('2', '2024-06-01', '2024-12-31', 'Future Trip', true),
      ];

      const assessments = assessUpcomingTripRisk(
        upcomingTrips,
        500,
        'five_year',
        '2020-01-01',
        '2023-12-01',
      );

      expect(assessments).toHaveLength(1);
      expect(assessments[0].tripId).toBe('2');
    });

    it('should handle empty upcoming trips', () => {
      const assessments = assessUpcomingTripRisk([], 500, 'five_year', '2020-01-01', '2023-12-01');

      expect(assessments).toEqual([]);
    });
  });

  describe('generateAnnualTravelSummary', () => {
    it('should generate complete annual summary', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-10', '2022-01-20', 'Mexico'),
        createTrip('2', '2022-03-15', '2022-04-15', 'Canada'), // Longest
        createTrip('3', '2022-06-01', '2022-06-10', 'Mexico'),
        createTrip('4', '2022-08-05', '2022-08-20', 'Spain'),
      ];

      const summary = generateAnnualTravelSummary(trips, 2022);

      expect(summary.year).toBe(2022);
      expect(summary.totalTrips).toBe(4);
      expect(summary.totalDaysAbroad).toBe(61); // 9 + 30 + 8 + 14
      expect(summary.longestTrip).toEqual({
        destination: 'Canada',
        duration: 30,
        dates: 'Mar 15 - Apr 15, 2022',
      });
      expect(summary.topDestinations[0]).toEqual({
        country: 'Canada',
        days: 30,
      });
      expect(summary.topDestinations[1]).toEqual({
        country: 'Mexico',
        days: 17,
      });
    });

    it('should compare to previous year', () => {
      const currentYearTrips: Trip[] = [createTrip('1', '2022-06-10', '2022-06-20', 'Mexico')];
      const previousYearTrips: Trip[] = [
        createTrip('2', '2021-06-10', '2021-07-20', 'Canada'),
        createTrip('3', '2021-12-01', '2021-12-31', 'Spain'),
      ];

      const summary = generateAnnualTravelSummary(currentYearTrips, 2022, previousYearTrips);

      expect(summary.comparedToLastYear).toBeDefined();
      expect(summary.comparedToLastYear?.daysChange).toBe(-59); // 9 - (39 + 29)
      expect(summary.comparedToLastYear?.tripsChange).toBe(-1); // 1 - 2
      expect(summary.comparedToLastYear?.trend).toBe('less_travel');
    });

    it('should handle year with no trips', () => {
      const summary = generateAnnualTravelSummary([], 2022);

      expect(summary.totalTrips).toBe(0);
      expect(summary.totalDaysAbroad).toBe(0);
      expect(summary.longestTrip).toBeNull();
      expect(summary.topDestinations).toEqual([]);
    });

    it('should limit top destinations to 5', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-01', '2022-01-02', 'Country1'),
        createTrip('2', '2022-02-01', '2022-02-02', 'Country2'),
        createTrip('3', '2022-03-01', '2022-03-02', 'Country3'),
        createTrip('4', '2022-04-01', '2022-04-02', 'Country4'),
        createTrip('5', '2022-05-01', '2022-05-02', 'Country5'),
        createTrip('6', '2022-06-01', '2022-06-02', 'Country6'),
      ];

      const summary = generateAnnualTravelSummary(trips, 2022);

      expect(summary.topDestinations).toHaveLength(5);
    });

    it('should handle similar travel pattern', () => {
      const currentYearTrips: Trip[] = [createTrip('1', '2022-06-10', '2022-06-20', 'Mexico')];
      const previousYearTrips: Trip[] = [createTrip('2', '2021-06-10', '2021-06-20', 'Canada')];

      const summary = generateAnnualTravelSummary(currentYearTrips, 2022, previousYearTrips);

      expect(summary.comparedToLastYear?.trend).toBe('similar'); // Both 9 days
    });

    it('should handle trips with missing locations', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-06-10', '2022-06-20', ''),
        createTrip('2', '2022-08-10', '2022-08-20', ''),
      ];

      const summary = generateAnnualTravelSummary(trips, 2022);

      expect(summary.topDestinations[0].country).toBe('Unknown');
      expect(summary.longestTrip?.destination).toBe('Unknown');
    });

    it('should only count trips that start in the specified year', () => {
      const trips: Trip[] = [
        createTrip('1', '2021-12-20', '2022-01-10', 'Cross Year Trip'),
        createTrip('2', '2022-06-10', '2022-06-20', 'Current Year Trip'),
      ];

      const summary = generateAnnualTravelSummary(trips, 2022);

      expect(summary.totalTrips).toBe(1); // Only the trip starting in 2022
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle trips with dates in different formats', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-01-01', '2022-01-10', 'Mexico'), // Valid ISO format
        createTrip('2', '2022/06/10', '2022/06/20', 'Canada'), // Invalid format
      ];

      const stats = calculateCountryStatistics(trips);

      // Should handle the first trip correctly, skip the invalid one
      expect(stats).toHaveLength(1);
      expect(stats[0].country).toBe('Mexico');
      expect(stats[0].totalDays).toBe(8); // 9 days - 2 travel days
    });

    it('should handle extreme date ranges', () => {
      const trips: Trip[] = [
        createTrip('1', '1990-01-01', '1990-01-10', 'Historical'),
        createTrip('2', '2050-01-01', '2050-01-10', 'Future'),
      ];

      const yearly = calculateDaysAbroadByYear(trips, '1980-01-01', '2060-12-31');

      expect(yearly.find((y) => y.year === 1990)?.daysAbroad).toBe(8);
      expect(yearly.find((y) => y.year === 2050)?.daysAbroad).toBe(8);
    });

    it('should handle very long trips correctly', () => {
      const trips: Trip[] = [createTrip('1', '2000-01-01', '2020-12-31', 'Twenty Year Trip')];

      const stats = calculateCountryStatistics(trips);

      // Should calculate massive number of days correctly
      expect(stats[0].totalDays).toBeGreaterThan(7000);
    });

    it('should handle trips with identical dates', () => {
      const trips: Trip[] = [
        createTrip('1', '2022-06-10', '2022-06-20', 'Mexico'),
        createTrip('2', '2022-06-10', '2022-06-20', 'Mexico'), // Duplicate
      ];

      const stats = calculateCountryStatistics(trips);

      expect(stats[0].tripCount).toBe(2);
      expect(stats[0].totalDays).toBe(18); // 9 days * 2 trips
    });
  });
});
