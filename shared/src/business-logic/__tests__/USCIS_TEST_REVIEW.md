# USCIS Physical Presence Calculator Test Review

## Official USCIS Rules (Confirmed)

1. **Departure and Return Days**: Both count as days present in the USA
2. **Physical Presence Requirement**:
   - 5-year path: 913 days (half of 5 years)
   - 3-year path: 548 days (half of 3 years)
3. **Continuous Residence**: Trips of 180+ days may break continuous residence

## Test Analysis

### ✅ Correct Tests

1. **Departure/Return Rule** (line 25-47)

   - Correctly counts March 1 and March 10 as present
   - March 2-9 = 8 days abroad
   - Status: CORRECT per USCIS rules

2. **Multiple Trips** (line 49-81)

   - Trip 1: Feb 2-4 = 3 days abroad
   - Trip 2: Jun 16-24 = 9 days abroad
   - Total: 12 days
   - Status: CORRECT

3. **Same-day trips** (line 142-163)
   - Same day departure/return = 0 days abroad
   - Status: CORRECT (both days count as present)

### ❓ Tests Requiring Verification

1. **Total Days Calculation** (line 12-23)

   - From Jan 1, 2020 to Jan 1, 2023
   - Current expectation: 1097 days (inclusive of both dates)
   - Question: Should "as of date" be inclusive?
   - **Recommendation**: This seems correct. When calculating "as of" a date, that date should be included.

2. **Leap Year Calculation** (line 235-245)

   - From Jan 1, 2020 to Dec 31, 2020
   - Expects: 366 days
   - This is correct for a leap year

3. **Trip Overlapping Green Card Date** (line 117-139)

   - Green card: June 15
   - Trip: June 10-20
   - Expected: 5 days abroad (June 15-19)
   - **Issue**: If June 15 is green card date AND person is already abroad, should it count as abroad?
   - Current implementation counts it as abroad, which seems logical

4. **Continuous Residence Warnings** (line 360-423)
   - Jan 1 to June 25 = expects 175 days
   - But differenceInDays gives 176
   - **Issue**: Test comment doesn't match expectation

### 🔴 Missing Edge Cases

1. **Trips with invalid dates**

   - Trip with return date before departure date (handled in validation)
   - Trip with null/undefined dates (handled in validation)

2. **Multiple overlapping trips**

   - Currently tested, but could add more complex scenarios

3. **Trips spanning multiple years**

   - Long trips that span calendar years

4. **Future trips**

   - Trips with dates after the "as of" date

5. **Partial day presence**

   - Arriving late in the day
   - Departing early in the day

6. **Time zone considerations**

   - International date line crossings

7. **Maximum trip duration warnings**

   - Trips approaching 365 days (1 year absence)

8. **Green card obtained mid-trip**

   - More complex scenarios where green card is obtained while abroad

9. **Early filing eligibility edge cases**
   - Exactly 90 days before eligibility
   - Leap year considerations for eligibility dates

## Recommendations

1. **Clarify "as of date" handling**: Add explicit test documentation about why it's inclusive
2. **Fix test comments**: Ensure all comments match the actual expectations
3. **Add missing edge cases**: Implement tests for the scenarios listed above
4. **Consider real-world scenarios**: Add tests based on common USCIS cases
5. **Document assumptions**: Each test should clearly state what USCIS rule it's testing
