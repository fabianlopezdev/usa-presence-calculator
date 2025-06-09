# Redundancy Elimination Plan

## Executive Summary

This plan outlines how to eliminate code redundancies found in the shared codebase while maintaining functionality and improving maintainability. The plan is organized by priority and impact.

**Update**: After reviewing the function documentation, additional redundancies were identified:

- Duplicate `getRemovalOfConditionsDeadline()` functions (lines 319-320 in function_documentation.md)
- Multiple "assess" functions with similar patterns (`assessLprStatusRisk` vs `assessLPRStatusRisk`)
- Redundant "get required" functions (`getRequiredDays` vs `getRequiredDaysForCategory`)
- Similar initialization functions across different modules

---

## 🎯 Goals

1. **Reduce code duplication** without breaking existing functionality
2. **Standardize common operations** across all modules
3. **Improve maintainability** by having single sources of truth
4. **Preserve module boundaries** while sharing common utilities
5. **Maintain backward compatibility** where needed

---

## 📊 Redundancy Categories & Solutions

### 1. 🗓️ Date Handling Standardization [HIGH PRIORITY]

**Problem**: Inconsistent use of `parseISO` (date-fns) vs `parseUTCDate` (custom utility)

**Solution**:

1. **Standardize on `parseUTCDate`** for all date parsing
   - It includes validation and ensures UTC consistency
   - Already used in critical calculations
2. **Create date utility exports** in `utils/date-helpers.ts`:
   ```typescript
   export {
     parseUTCDate as parseDate,
     formatUTCDate as formatDate,
     getCurrentUTCDate as getCurrentDate,
     // ... other utilities
   };
   ```
3. **Migration approach**:
   - Replace all `parseISO` imports with `parseDate`
   - Add tests to ensure no behavior changes
   - Update one module at a time

**Effort**: Medium (touches many files but straightforward replacement)

### 2. 📏 Trip Duration Calculation Consolidation [HIGH PRIORITY]

**Problem**: Multiple functions calculate days abroad differently

**Solution**:

1. **Create unified trip calculation utilities** in `utils/trip-calculations.ts`:

   ```typescript
   export interface TripDurationOptions {
     includeDepartureDay?: boolean; // default: true (USCIS rule)
     includeReturnDay?: boolean; // default: true (USCIS rule)
     startBoundary?: Date; // for period-specific calculations
     endBoundary?: Date; // for period-specific calculations
   }

   export function calculateTripDuration(trip: Trip, options: TripDurationOptions = {}): number;

   export function calculateTripDaysInPeriod(
     trip: Trip,
     startDate: Date,
     endDate: Date,
     options: TripDurationOptions = {},
   ): number;
   ```

2. **Refactor existing functions** to use these utilities:
   - `calculateTripDaysAbroad` → Use new utility with period boundaries
   - `calculateTripDaysAbroadExcludingTravelDays` → Use with `includeDepartureDay: false, includeReturnDay: false`
   - `calculateDaysAbroadInYear` → Use with year boundaries

**Effort**: Medium-High (requires careful testing of USCIS rules)

### 3. 🚨 Risk Assessment Consolidation [MEDIUM PRIORITY]

**Problem**: Duplicate `determineGreenCardRiskLevel` functions and overlapping risk logic

**Solution**:

1. **Remove local implementation** in `comprehensive.ts`
2. **Import from `assessment-helpers.ts`** instead
3. **Create risk assessment hierarchy**:

   ```typescript
   // Base risk assessment interface
   export interface RiskAssessment {
     level: 'low' | 'medium' | 'high' | 'critical';
     threshold?: number;
     message: string;
   }

   // Specific risk assessors extend base
   export interface GreenCardRiskAssessment extends RiskAssessment {
     hasReentryPermit: boolean;
     daysUntilNextThreshold: number;
   }
   ```

**Effort**: Low (mostly removing duplicate code)

### 4. ✅ Validation Function Unification [MEDIUM PRIORITY]

**Problem**: Multiple similar validation functions for trips

**Solution**:

1. **Create validation hierarchy** in `utils/validation.ts`:

   ```typescript
   export function isValidTrip(trip: unknown): trip is Trip;

   export function isValidTripWithId(trip: unknown): trip is Trip & { id: string };

   export function validateTripForCalculation(
     trip: Trip,
     requirements: {
       needsId?: boolean;
       needsLocation?: boolean;
       allowSimulated?: boolean;
     },
   ): boolean;
   ```

2. **Deprecate redundant validators**:
   - Keep for backward compatibility with deprecation notices
   - Update all usages to new validators

**Effort**: Medium (need to ensure all edge cases are covered)

### 5. 🎯 Priority/Status Pattern Extraction [LOW PRIORITY]

**Problem**: Repeated patterns for priority items and status calculations

**Solution**:

1. **Create generic compliance handler**:

   ```typescript
   export interface ComplianceConfig<TStatus> {
     type: ComplianceItemType;
     checkApplies: (status: TStatus) => boolean;
     checkUrgent: (status: TStatus) => boolean;
     getDescription: (status: TStatus) => string;
     getDeadline: (status: TStatus) => string | null;
   }

   export function createPriorityItemGetter<TStatus>(
     config: ComplianceConfig<TStatus>,
   ): (status: TStatus) => PriorityComplianceItem | null;
   ```

2. **Refactor priority functions** to use the generic handler

**Effort**: High (requires significant refactoring but pays off long-term)

### 6. 📅 Deadline Calculation Pattern [LOW PRIORITY]

**Problem**: Similar deadline calculation patterns repeated

**Solution**:

1. **Extract common deadline patterns**:
   ```typescript
   export function calculateWindowDates(
     baseDate: string,
     windowConfig: {
       startOffsetDays?: number;
       endOffsetDays?: number;
       startOffsetYears?: number;
       endOffsetYears?: number;
     },
   ): { windowStart: string; windowEnd: string };
   ```

**Effort**: Low-Medium

### 7. 🔁 Duplicate Function Names [HIGH PRIORITY]

**Problem**: Multiple functions with same/similar names

**Found Duplicates**:

- `getRemovalOfConditionsDeadline()` appears twice (compliance-helpers.ts and removal-of-conditions.ts)
- `assessLprStatusRisk()` vs `assessLPRStatusRisk()` (case inconsistency)
- `getRequiredDays()` vs `getRequiredDaysForCategory()` (overlapping functionality)
- `assessTripRiskForAllLegalThresholds()` appears in both assessment.ts and comprehensive.ts

**Solution**:

1. **Audit and consolidate duplicate functions**
2. **Standardize naming conventions** (prefer camelCase consistently)
3. **Remove redundant implementations**
4. **Create aliases for backward compatibility if needed**

**Effort**: Low (mostly removing duplicates)

### 8. 🏗️ Initialization Function Pattern [MEDIUM PRIORITY]

**Problem**: Similar initialization patterns across modules

**Found Patterns**:

- `initializeAssessmentResult()`
- `initializeLPRStatusAssessment()`
- `initializeMaxTripResult()`
- `initializeReentryPermitProtection()`

**Solution**:

1. **Create generic initialization utility**:
   ```typescript
   export function createInitializer<T>(defaultValues: T): () => T {
     return () => ({ ...defaultValues });
   }
   ```
2. **Or use factory pattern for complex initializations**

**Effort**: Medium

### 9. 🎯 "Handle" Function Pattern [LOW PRIORITY]

**Problem**: 15+ functions starting with "handle" following similar patterns

**Solution**:

1. **Extract common handler pattern**:

   ```typescript
   export interface HandlerConfig<T, R> {
     condition: (input: T) => boolean;
     action: (input: T) => R;
     priority?: number;
   }

   export function createHandlerChain<T, R>(
     handlers: HandlerConfig<T, R>[],
   ): (input: T) => R | null;
   ```

**Effort**: High (but high long-term value)

---

## 🚀 Implementation Plan

### Phase 0: Quick Wins (Week 0.5) [NEW]

1. **Fix duplicate function names**:
   - [ ] Audit `getRemovalOfConditionsDeadline()` duplicates
   - [ ] Fix `assessLprStatusRisk` casing inconsistency
   - [ ] Consolidate `assessTripRiskForAllLegalThresholds()`
   - [ ] Resolve `getRequiredDays` redundancy
2. **Remove obvious duplicates**
3. **Run tests to ensure nothing breaks**

### Phase 1: Foundation (Week 1)

1. Create new utility files:
   - [ ] `utils/date-helpers.ts` (extend existing)
   - [ ] `utils/trip-calculations.ts`
   - [ ] `utils/validation.ts`
   - [ ] `utils/initialization.ts` [NEW]
2. Add comprehensive tests for new utilities
3. Document new APIs

### Phase 2: Date Standardization (Week 2)

1. Replace `parseISO` with `parseDate` in:
   - [ ] Compliance modules (9 files)
   - [ ] Add deprecation notices
2. Run all tests after each module update
3. Update any affected tests

### Phase 3: Trip Calculations (Week 3)

1. Refactor trip duration calculations:
   - [ ] Update presence calculator
   - [ ] Update travel analytics
   - [ ] Update LPR status calculations
2. Ensure USCIS rules are preserved
3. Document USCIS rule compliance in code

### Phase 4: Risk & Validation (Week 4)

1. Consolidate risk assessment functions
2. Unify validation functions
3. Remove duplicate code
4. Standardize initialization patterns

### Phase 5: Pattern Extraction (Week 5+)

1. Extract generic patterns for:
   - [ ] Priority items
   - [ ] Status calculations
   - [ ] Handler chains
2. Refactor compliance modules to use patterns
3. Document new patterns

---

## ⚠️ Risks & Mitigations

### Risk 1: Breaking Changes

- **Mitigation**: Extensive test coverage before refactoring
- **Mitigation**: Use feature flags for gradual rollout
- **Mitigation**: Keep deprecated functions temporarily

### Risk 2: USCIS Rule Violations

- **Mitigation**: Document all USCIS rules in code
- **Mitigation**: Add specific tests for edge cases
- **Mitigation**: Get legal review if needed

### Risk 3: Performance Impact

- **Mitigation**: Benchmark before and after changes
- **Mitigation**: Profile critical paths
- **Mitigation**: Optimize hot paths if needed

---

## 📈 Success Metrics

1. **Code Reduction**: Target 20-30% reduction in total lines
2. **Test Coverage**: Maintain or improve current coverage (currently 543 tests)
3. **Performance**: No regression in critical paths
4. **Maintainability**: Reduce time to implement new features
5. **Function Count**: Reduce from 268 to ~200 functions through consolidation

---

## 🔄 Alternative Approaches Considered

1. **Complete Rewrite**: Rejected - too risky and time-consuming
2. **Module Consolidation**: Rejected - would break module boundaries
3. **Status Quo**: Rejected - redundancy will compound over time

---

## 📝 Notes

- Priority is given to high-impact, low-risk changes
- Each phase should be completed and tested before moving to the next
- Backward compatibility is maintained where possible
- Documentation is updated alongside code changes

---

## 📋 Summary of Enhanced Findings

After reviewing the function documentation, we discovered:

1. **268 total functions** across 54 files
2. **Direct duplicates**: At least 4 functions with exact same names
3. **Pattern redundancy**: 15+ "handle" functions, 4+ "initialize" functions
4. **Naming inconsistencies**: Mixed casing (LPR vs Lpr)
5. **Similar functionality**: Multiple functions doing same calculations differently

The enhanced plan now includes:

- **Phase 0**: Quick wins to fix obvious duplicates
- **Additional utilities**: Initialization patterns
- **More specific metrics**: Function count reduction target
- **Better organization**: Grouped related redundancies together

---

## ✅ Approval Checklist

Before proceeding, please confirm:

- [ ] The plan aligns with project goals
- [ ] The timeline is acceptable
- [ ] The risk mitigations are sufficient
- [ ] The phased approach makes sense
- [ ] Any specific concerns are addressed
- [ ] Phase 0 "Quick Wins" approach is approved
