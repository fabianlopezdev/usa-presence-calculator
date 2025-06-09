# Comprehensive Test Reference - USA Presence Calculator Shared Package

This document provides a complete reference for ALL test files in the shared package, documenting test coverage, scenarios tested, and edge cases handled to ensure code quality and USCIS compliance.

## Summary Audit

### Overall Test Statistics
- **Total Test Files**: 21
- **Total Test Cases**: ~650+
- **Test Categories**: 7 major areas
- **Edge Case Coverage**: Extensive (200+ edge case tests)
- **USCIS Rule Validation**: Complete coverage

### Test Coverage by Category

| Category | Test Files | Test Cases | Coverage Focus |
|----------|------------|------------|----------------|
| **Compliance** | 5 | ~250 | Green card renewal, I-751, selective service, taxes |
| **LPR Status** | 3 | ~60 | Abandonment risk, reentry permits, pattern analysis |
| **Presence Calculation** | 3 | ~85 | Physical presence, continuous residence, eligibility |
| **Travel Risk** | 2 | ~60 | Risk thresholds, permit protection, warnings |
| **Travel Analytics** | 1 | ~50 | Statistics, projections, budgets, summaries |
| **Utils** | 3 | ~130 | Date handling, trip calculations, validation |
| **Schemas** | 4 | ~45 | Data validation, type safety |

## Table of Contents

1. [Test Coverage by Feature](#test-coverage-by-feature)
   - [Compliance Tests](#compliance-tests)
   - [LPR Status Tests](#lpr-status-tests)
   - [Presence Calculation Tests](#presence-calculation-tests)
   - [Travel Risk Tests](#travel-risk-tests)
   - [Travel Analytics Tests](#travel-analytics-tests)
   - [Utility Tests](#utility-tests)
   - [Schema Tests](#schema-tests)
2. [Edge Cases Coverage](#edge-cases-coverage)
3. [USCIS Rules Validation](#uscis-rules-validation)
4. [Test Files by Path](#test-files-by-path)
5. [Critical Scenarios Tested](#critical-scenarios-tested)

---

## Test Coverage by Feature

### Compliance Tests

#### **compliance-coordinator.test.ts**
**Path**: `/business-logic/calculations/compliance/__tests__/`
**Test Suites**: 5 | **Test Cases**: 34

**What It Tests**:
- Comprehensive compliance status aggregation
- Active compliance item detection
- Priority item calculation and sorting
- Upcoming deadline tracking
- Integration of all compliance modules

**Key Scenarios**:
- Multiple simultaneous deadlines
- Conflicting priorities
- Empty compliance states
- Date boundary conditions

#### **green-card-renewal.test.ts**
**Path**: `/business-logic/calculations/compliance/__tests__/`
**Test Suites**: 13 | **Test Cases**: 46

**What It Tests**:
- Green card expiration calculations
- Renewal window detection (6-month window)
- Renewal urgency levels
- Status transitions

**Edge Cases**:
- Leap year expirations
- Weekend/holiday adjustments
- Already expired cards
- Timezone handling
- Month boundary transitions

#### **removal-of-conditions.test.ts**
**Path**: `/business-logic/calculations/compliance/__tests__/`
**Test Suites**: 11 | **Test Cases**: 38

**What It Tests**:
- I-751 filing window calculations
- 90-day filing window before 2-year anniversary
- Filing status tracking
- Conditional resident validation

**Edge Cases**:
- Leap day green card dates
- Future green card dates
- Already filed/approved cases
- Window boundary precision
- Invalid resident types

#### **selective-service.test.ts**
**Path**: `/business-logic/calculations/compliance/__tests__/`
**Test Suites**: 11 | **Test Cases**: 44

**What It Tests**:
- Age-based registration requirements (18-26 males)
- Registration deadline calculations
- Gender-based applicability
- Status transitions with age

**Edge Cases**:
- Leap day birthdays
- Exact age boundaries
- Gender edge cases
- Registration anomalies
- Future birth dates

#### **tax-reminders.test.ts**
**Path**: `/business-logic/calculations/compliance/__tests__/`
**Test Suites**: 16 | **Test Cases**: 86

**What It Tests**:
- Tax filing deadline calculations
- DC Emancipation Day adjustments
- Abroad extension eligibility
- Tax season detection
- Trip overlap with tax season

**Edge Cases**:
- Weekend deadline adjustments
- Holiday conflicts
- Leap year handling
- Multiple overlapping trips
- Dismissal state management

### LPR Status Tests

#### **lpr-status-calculator.test.ts**
**Path**: `/business-logic/calculations/lpr-status/__tests__/`
**Test Suites**: 3 | **Test Cases**: 13

**What It Tests**:
- Basic LPR abandonment risk assessment
- Risk levels based on trip duration
- Maximum safe trip calculations
- Reentry permit basic protection

**Key Thresholds Tested**:
- 150 days: Warning level
- 180 days: Presumption of abandonment
- 365 days: Automatic loss risk

#### **lpr-status-advanced-scenarios.test.ts**
**Path**: `/business-logic/calculations/lpr-status/__tests__/`
**Test Suites**: 7 | **Test Cases**: 15

**Advanced Scenarios**:
1. **Rebuttable Presumption** (180-364 days)
   - Mitigating factors evaluation
   - Evidence requirements

2. **Reentry Permit Lifecycle**
   - Pending vs approved status
   - Expiration handling
   - Protection limitations

3. **Conditional Permanent Residence**
   - I-751 priority over travel
   - Filing window interactions

4. **Pattern of Non-Residence**
   - Multiple short trips
   - Minimal US presence patterns

5. **N-470 Exemptions**
   - Government service protection
   - Qualifying employment

6. **Combined Risk Factors**
   - Multiple simultaneous risks
   - Priority determination

#### **lpr-status-edge-cases.test.ts**
**Path**: `/business-logic/calculations/lpr-status/__tests__/`
**Test Suites**: 4 | **Test Cases**: 31

**Edge Cases**:
- Empty trip arrays
- Same-day trips
- Overlapping trips
- Invalid date formats
- Future green card dates
- Permit expiration boundaries
- Leap year calculations

### Presence Calculation Tests

#### **presence-calculator.test.ts** (Root)
**Path**: `/business-logic/__tests__/`
**Test Suites**: 5 | **Test Cases**: 38

**Core Functionality**:
- Total days of physical presence
- USCIS day counting rules
- Continuous residence checking
- Eligibility date calculations
- Early filing window (90 days)

#### **presence-calculator-edge-cases.test.ts**
**Path**: `/business-logic/calculations/presence/__tests__/`
**Test Suites**: 6 | **Test Cases**: 19

**Complex Scenarios**:
- Overlapping trips
- Back-to-back trips
- Future trip handling
- Green card date anomalies
- Data validation edge cases
- Real-world user scenarios

#### **presence-calculator-helpers.test.ts**
**Path**: `/business-logic/calculations/presence/__tests__/`
**Test Suites**: 5 | **Test Cases**: 28

**Helper Functions**:
- Date validation and parsing
- Trip validation logic
- Days abroad calculations
- Residence warning creation
- USCIS-compliant counting

### Travel Risk Tests

#### **travel-risk-helpers-enhanced.test.ts**
**Path**: `/business-logic/calculations/travel-risk/__tests__/`
**Test Suites**: 7 | **Test Cases**: 29

**Risk Assessment**:
- Comprehensive threshold testing
- Green card abandonment risk
- Permit protection evaluation
- Individual threshold checks

#### **travel-risk-helpers-edge-cases.test.ts**
**Path**: `/business-logic/calculations/travel-risk/__tests__/`
**Test Suites**: 5 | **Test Cases**: 31

**Edge Scenarios**:
- Boundary value testing
- Permit edge cases
- Date calculation anomalies
- Complex interactions

### Travel Analytics Tests

#### **travel-analytics.test.ts**
**Path**: `/business-logic/calculations/travel-analytics/__tests__/`
**Test Suites**: 9 | **Test Cases**: 52

**Analytics Features**:
- Country visit statistics
- Yearly travel breakdowns
- Travel streak analysis
- Milestone calculations
- Safe travel budgets
- Eligibility projections
- Risk assessments
- Annual summaries

**Edge Cases**:
- Empty data handling
- Invalid trip data
- Extreme date ranges
- Performance with large datasets

### Utility Tests

#### **date-helpers.test.ts**
**Path**: `/utils/__tests__/`
**Test Suites**: 15 | **Test Cases**: 48

**Date Operations**:
- UTC date handling
- Format validation (YYYY-MM-DD)
- Leap year calculations
- Date arithmetic
- Timezone safety
- Extreme date handling

#### **trip-calculations.test.ts**
**Path**: `/utils/__tests__/`
**Test Suites**: 6 | **Test Cases**: 38

**Trip Calculations**:
- USCIS-compliant duration
- Period overlap calculations
- Year boundary handling
- Travel day exclusion
- Day set population

**Critical USCIS Rules**:
- Departure day counts as presence
- Return day counts as presence
- Proper overlap handling

#### **validation.test.ts**
**Path**: `/utils/__tests__/`
**Test Suites**: 8 | **Test Cases**: 46

**Validation Logic**:
- Trip data validation
- ID requirements
- Location requirements
- Simulated trip handling
- Date range validation
- Filtering operations

### Schema Tests

#### **trip.test.ts**
**Path**: `/schemas/__tests__/`
**Test Cases**: 13

**Validates**:
- Trip data structure
- Date format enforcement
- Return > departure validation
- UUID format
- Optional fields

#### **user.test.ts**
**Path**: `/schemas/__tests__/`
**Test Cases**: 10

**Validates**:
- User profile structure
- Email validation
- Green card date format
- OAuth provider data
- Settings preferences

#### **presence.test.ts**
**Path**: `/schemas/__tests__/`
**Test Cases**: 11

**Validates**:
- Calculation results
- Status enums
- Warning structures
- Milestone data
- Percentage constraints

#### **notification.test.ts**
**Path**: `/schemas/__tests__/`
**Test Cases**: 9

**Validates**:
- Notification structure
- Type constraints
- Preference settings
- Timestamp formats

---

## Edge Cases Coverage

### Date & Time Edge Cases
- **Leap Years**: Feb 29 births, green card dates, trip dates
- **Month Boundaries**: 31st of month handling, February variations
- **Year Boundaries**: Dec 31 to Jan 1 transitions
- **DST Transitions**: Spring forward/fall back handling
- **Timezone**: UTC consistency across calculations
- **Extreme Dates**: Year 1900, 2099, invalid dates

### USCIS Rule Edge Cases
- **Day Counting**: Departure/return day inclusion
- **Continuous Residence**: 179 vs 180 vs 181 days
- **Early Filing**: Exactly 90 days before eligibility
- **Overlapping Trips**: Proper day deduplication
- **Same-Day Trips**: 0-day duration handling

### Data Integrity Edge Cases
- **Empty Arrays**: No trips, no data
- **Invalid Data**: Null, undefined, malformed
- **Future Dates**: Future green cards, future trips
- **Duplicate Data**: Same trips, overlapping periods
- **Boundary Values**: 0, 1, maximum integers

### System Edge Cases
- **Performance**: Large datasets (1000+ trips)
- **Memory**: Set size limitations
- **Precision**: Date calculation accuracy
- **Consistency**: Cross-module agreement

---

## USCIS Rules Validation

### Physical Presence Rules
✅ **Departure day counts as presence**
✅ **Return day counts as presence**
✅ **913 days for 5-year path**
✅ **548 days for 3-year path**
✅ **90-day early filing window**

### Continuous Residence Rules
✅ **180+ days breaks residence**
✅ **365+ days automatic break**
✅ **Warning at 150 days**
✅ **5 years for standard path**
✅ **3 years for marriage path**

### LPR Abandonment Rules
✅ **180 days: Rebuttable presumption**
✅ **365 days: High risk of loss**
✅ **Reentry permit: 2-year protection**
✅ **Pattern analysis for frequent travel**
✅ **Mitigating factors consideration**

### Compliance Deadlines
✅ **I-751: 90-day window before 2 years**
✅ **Green card: 6-month renewal window**
✅ **Selective service: 30 days after 18**
✅ **Tax filing: April 15 with adjustments**

---

## Test Files by Path

### Business Logic Tests
```
/src/business-logic/
├── __tests__/
│   └── presence-calculator.test.ts (38 tests)
└── calculations/
    ├── compliance/__tests__/
    │   ├── compliance-coordinator.test.ts (34 tests)
    │   ├── green-card-renewal.test.ts (46 tests)
    │   ├── removal-of-conditions.test.ts (38 tests)
    │   ├── selective-service.test.ts (44 tests)
    │   └── tax-reminders.test.ts (86 tests)
    ├── lpr-status/__tests__/
    │   ├── lpr-status-advanced-scenarios.test.ts (15 tests)
    │   ├── lpr-status-calculator.test.ts (13 tests)
    │   └── lpr-status-edge-cases.test.ts (31 tests)
    ├── presence/__tests__/
    │   ├── presence-calculator-edge-cases.test.ts (19 tests)
    │   └── presence-calculator-helpers.test.ts (28 tests)
    ├── travel-analytics/__tests__/
    │   └── travel-analytics.test.ts (52 tests)
    └── travel-risk/__tests__/
        ├── travel-risk-helpers-edge-cases.test.ts (31 tests)
        └── travel-risk-helpers-enhanced.test.ts (29 tests)
```

### Utility & Schema Tests
```
/src/
├── schemas/__tests__/
│   ├── notification.test.ts (9 tests)
│   ├── presence.test.ts (11 tests)
│   ├── trip.test.ts (13 tests)
│   └── user.test.ts (10 tests)
└── utils/__tests__/
    ├── date-helpers.test.ts (48 tests)
    ├── trip-calculations.test.ts (38 tests)
    └── validation.test.ts (46 tests)
```

---

## Critical Scenarios Tested

### 1. **Multiple Simultaneous Risks**
- I-751 deadline + long trip abroad
- Tax deadline during travel
- Selective service + green card renewal

### 2. **Complex Travel Patterns**
- Frequent short trips (commuter pattern)
- Back-to-back international travel
- Overlapping trip records

### 3. **Boundary Conditions**
- Exactly 180 days abroad
- Trip ending on deadline day
- Early filing exactly 90 days

### 4. **Real-World Scenarios**
- COVID-19 travel restrictions
- Government service abroad
- Medical emergencies

### 5. **Data Quality Issues**
- Incomplete trip records
- Conflicting dates
- Missing information

---

## Test Quality Metrics

### Coverage Completeness
- ✅ All exported functions have tests
- ✅ All schema validations tested
- ✅ All USCIS rules validated
- ✅ All edge cases covered
- ✅ Error conditions handled

### Test Characteristics
- **Isolated**: No test depends on another
- **Repeatable**: Consistent results
- **Fast**: Most tests < 10ms
- **Clear**: Descriptive test names
- **Comprehensive**: Multiple scenarios per function

### Maintenance
- Tests updated with code changes
- New edge cases added as discovered
- Performance benchmarks maintained
- Documentation kept current

---

This comprehensive test reference demonstrates:
- **Thorough Coverage**: 650+ tests across all modules
- **Edge Case Focus**: 200+ edge case specific tests
- **USCIS Compliance**: All rules properly validated
- **Real-World Ready**: Practical scenarios covered
- **Quality Assurance**: Robust error handling

The test suite provides confidence that the USA Presence Calculator correctly handles the complex requirements of immigration law and delivers accurate results for LPRs tracking their eligibility.