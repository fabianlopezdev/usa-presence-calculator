# Compliance Edge Case Test Plan

## 1. Removal of Conditions Edge Cases

### Step-by-Step Plan:

#### Step 1: Temporal Boundary Edge Cases

- **Test Case 1.1**: Green card issued at midnight (00:00:00)
  - Verify filing window calculations are consistent
  - Test with current time also at midnight
- **Test Case 1.2**: Time zone transitions
  - Green card issued during DST transition dates
  - Test calculations when crossing spring forward/fall back dates
- **Test Case 1.3**: Millisecond precision
  - Green card date with .999 milliseconds before midnight
  - Ensure day calculations round correctly

#### Step 2: Data Integrity Edge Cases

- **Test Case 2.1**: Invalid but parseable dates
  - Dates like '2022-02-30' (Feb 30th doesn't exist)
  - Dates like '2022-13-01' (13th month)
- **Test Case 2.2**: Extreme past/future dates
  - Green card from 1900
  - Green card from year 3000
- **Test Case 2.3**: Null/undefined handling
  - Missing green card date
  - Undefined current date with various statuses

#### Step 3: Status Transition Edge Cases

- **Test Case 3.1**: Multiple status changes in one day
  - Filed status on the deadline day
  - Approved status on overdue day
- **Test Case 3.2**: Retroactive status updates
  - Filed status with past date
  - Current date before filing date
- **Test Case 3.3**: Status conflicts
  - Approved but checking if overdue
  - Filed but before filing window

#### Step 4: Business Logic Edge Cases

- **Test Case 4.1**: Conditional resident status changes
  - Became conditional after being permanent
  - Status change mid-calculation
- **Test Case 4.2**: Multiple green cards
  - Previous conditional, now permanent
  - Lost and replaced green card scenarios
- **Test Case 4.3**: Edge of filing window
  - Exactly 89 days before anniversary (not in window)
  - Exactly 90 days before anniversary (in window)
  - One second before/after window boundaries

#### Step 5: Leap Year Complex Scenarios

- **Test Case 5.1**: Century leap year rules
  - Green card on Feb 29, 2000 (century leap year)
  - Filing window in 2100 (not a leap year despite divisible by 4)
- **Test Case 5.2**: Leap second considerations
  - Green card issued during a leap second
  - Filing window during leap second

## 2. Green Card Renewal Edge Cases

### Step-by-Step Plan:

#### Step 1: Expiration Date Anomalies

- **Test Case 1.1**: Never-expiring green cards
  - Old green cards without expiration dates
  - Placeholder dates like '9999-12-31'
- **Test Case 1.2**: Already expired at issuance
  - Green card with past expiration date
  - Negative validity period

#### Step 2: Renewal Window Edge Cases

- **Test Case 2.1**: Multiple renewals
  - Currently renewing an already renewed card
  - Renewal application pending scenarios
- **Test Case 2.2**: Special visa categories
  - 2-year conditional cards needing renewal
  - Diplomatic status cards

#### Step 3: Date Calculation Extremes

- **Test Case 3.1**: Month-end anomalies
  - Expiring on Jan 31, renewal window starts Jul 31
  - February 28/29 handling in renewal calculations
- **Test Case 3.2**: Fractional month calculations
  - 5.99 months until expiration (still medium urgency?)
  - 2.01 months (high urgency threshold)

## 3. Selective Service Edge Cases

### Step-by-Step Plan:

#### Step 1: Age Boundary Complexities

- **Test Case 1.1**: Born on leap day
  - Feb 29 birthdate, registration deadline calculations
  - 26th birthday on non-leap year
- **Test Case 1.2**: Time-sensitive age calculations
  - Born at 11:59 PM, checking at 12:01 AM
  - Timezone considerations for birth location

#### Step 2: Gender Edge Cases

- **Test Case 2.1**: Gender transitions
  - Changed gender after 18
  - Non-binary gender markers
- **Test Case 2.2**: Missing/unknown gender
  - Null gender data
  - Legacy data without gender field

#### Step 3: Registration Status Anomalies

- **Test Case 3.1**: Pre-registration scenarios
  - Registered before turning 18
  - Future-dated registration
- **Test Case 3.2**: Exemption scenarios
  - Military service exemptions
  - Disability exemptions

## 4. Tax Filing Reminder Edge Cases

### Step-by-Step Plan:

#### Step 1: Tax Year Transitions

- **Test Case 1.1**: Checking on Jan 1
  - Previous year's taxes not filed
  - Current year calculations
- **Test Case 1.2**: Extended filing deadlines
  - October 15 extension scenarios
  - Foreign filing extensions

#### Step 2: Travel Pattern Anomalies

- **Test Case 2.1**: Continuous travel
  - Abroad for entire tax year
  - Multiple trips spanning tax seasons
- **Test Case 2.2**: Same-day trips
  - Departure and return on April 15
  - Timezone crossing on tax deadline

#### Step 3: Dismissal Logic Edge Cases

- **Test Case 3.1**: Dismissal timing
  - Dismissed on April 14, checking April 15
  - Dismissed for future year
- **Test Case 3.2**: Multiple tax years
  - Dismissed 2023, but checking for 2024
  - Retroactive dismissals

## 5. Compliance Coordinator Edge Cases

### Step-by-Step Plan:

#### Step 1: Multiple Simultaneous Deadlines

- **Test Case 1.1**: All deadlines on same day
  - Every compliance item due on same date
  - Priority ordering validation
- **Test Case 1.2**: Cascading deadlines
  - One deadline triggers another
  - Interdependent compliance items

#### Step 2: Data Consistency Edge Cases

- **Test Case 2.1**: Conflicting statuses
  - Conditional resident with 10-year green card
  - Male with selective service exemption but required
- **Test Case 2.2**: Incomplete data scenarios
  - Missing required fields for some calculations
  - Partial compliance data

#### Step 3: Priority Calculation Edge Cases

- **Test Case 3.1**: Equal priority items
  - Multiple critical items
  - Tie-breaking logic validation
- **Test Case 3.2**: Dynamic priority changes
  - Priority changes based on date
  - User actions affecting priority

## Implementation Order

1. **Phase 1**: Removal of Conditions - Most complex date calculations
2. **Phase 2**: Green Card Renewal - Simpler but important
3. **Phase 3**: Selective Service - Age-based complexity
4. **Phase 4**: Tax Reminders - Travel pattern complexity
5. **Phase 5**: Compliance Coordinator - Integration complexity

Each phase will:

1. Implement edge case tests
2. Run full test suite
3. Fix any discovered issues
4. Commit changes
5. Move to next phase

## Success Criteria

- All edge cases pass
- Code coverage remains >80%
- No regression in existing tests
- Performance benchmarks maintained
- Clear documentation of edge case handling
