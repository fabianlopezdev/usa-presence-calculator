# USA Presence Calculator - Technical Architecture Documentation

## Executive Summary

The USA Presence Calculator is a sophisticated mobile application designed to help U.S. Lawful Permanent Residents (LPRs) track their physical presence and continuous residence requirements for naturalization eligibility. This document provides a comprehensive technical overview of the shared library (`@usa-presence/shared`), which forms the core business logic foundation for the entire application.

### Key Statistics
- **194 Total Functions** (145 exported, 49 internal)
- **89 Zod Schemas** with 1:1 TypeScript type mappings
- **42 Main Constants** with ~250+ individual values
- **650+ Test Cases** across 21 test files
- **9 Major Feature Areas** organized into logical modules

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Core Business Domains](#core-business-domains)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Key Algorithms and Calculations](#key-algorithms-and-calculations)
5. [Schema Design and Validation](#schema-design-and-validation)
6. [Module Organization](#module-organization)
7. [Technical Design Decisions](#technical-design-decisions)
8. [Integration Points](#integration-points)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)

## System Architecture Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App<br/>React Native/Expo]
        Web[Web Dashboard<br/>Future]
    end
    
    subgraph "Shared Business Logic"
        Core[@usa-presence/shared]
        Schemas[Zod Schemas]
        BL[Business Logic]
        Constants[Constants]
        Utils[Utilities]
    end
    
    subgraph "API Layer"
        API[NestJS API<br/>Optional Sync]
        DB[(PostgreSQL)]
    end
    
    Mobile --> Core
    Web --> Core
    Core --> Schemas
    Core --> BL
    Core --> Constants
    Core --> Utils
    Mobile -.-> API
    API --> DB
    
    style Core fill:#f9f,stroke:#333,stroke-width:4px
    style Mobile fill:#bbf,stroke:#333,stroke-width:2px
    style API fill:#bfb,stroke:#333,stroke-width:2px
```

### Core Design Principles

1. **Offline-First**: All calculations run locally without network dependency
2. **Type-Safe**: Zod schemas provide runtime validation and compile-time types
3. **USCIS Compliant**: Strict adherence to immigration law requirements
4. **Functional Programming**: Pure functions with no side effects
5. **UTC-First**: All date handling in UTC to avoid timezone issues

## Core Business Domains

### 1. Physical Presence Calculation

The most critical domain, handling USCIS day-counting rules for naturalization eligibility.

```mermaid
graph LR
    subgraph "Input"
        Trips[Trip History]
        GC[Green Card Date]
        AsOf[As-Of Date]
    end
    
    subgraph "Processing"
        Validate[Validate Dates]
        Filter[Filter Trips]
        Calculate[Calculate Days]
        Dedupe[Deduplicate<br/>Overlaps]
    end
    
    subgraph "Output"
        Days[Days in USA]
        Abroad[Days Abroad]
        Status[Eligibility Status]
    end
    
    Trips --> Validate
    GC --> Validate
    AsOf --> Validate
    Validate --> Filter
    Filter --> Calculate
    Calculate --> Dedupe
    Dedupe --> Days
    Dedupe --> Abroad
    Days --> Status
```

**Key Features:**
- USCIS-compliant day counting (departure/return days count as presence)
- Overlapping trip deduplication using Set data structure
- Continuous residence validation (180+ day trips)
- Early filing window calculation (90 days before eligibility)

### 2. Compliance Management System

Tracks five major compliance areas critical for LPRs:

```mermaid
graph TD
    subgraph "Compliance Areas"
        I751[I-751 Removal<br/>of Conditions]
        GCR[Green Card<br/>Renewal]
        SS[Selective Service<br/>Registration]
        Tax[Tax Filing<br/>Reminders]
    end
    
    subgraph "Coordinator"
        CC[Compliance<br/>Coordinator]
        Priority[Priority<br/>Sorting]
        Active[Active Items<br/>Tracking]
        Deadlines[Deadline<br/>Management]
    end
    
    I751 --> CC
    GCR --> CC
    SS --> CC
    Tax --> CC
    
    CC --> Priority
    CC --> Active
    CC --> Deadlines
    
    Priority --> Output[Prioritized<br/>Action Items]
    Active --> Output
    Deadlines --> Output
```

### 3. LPR Status Risk Assessment

Advanced pattern analysis for frequent travelers:

```mermaid
stateDiagram-v2
    [*] --> Maintained: No Risks
    Maintained --> AtRisk: 150+ days abroad
    AtRisk --> Presumed: 180+ days (rebuttable)
    Presumed --> Abandoned: 365+ days
    
    AtRisk --> Maintained: Return to USA
    Presumed --> Maintained: Overcome presumption
    
    note right of Presumed
        Requires evidence of:
        - US employment
        - US home/family
        - Tax filing
        - Intent to return
    end note
    
    note right of Abandoned
        May need SB-1 visa
        or reapply for
        green card
    end note
```

### 4. Travel Analytics Engine

Provides insights and projections:

```mermaid
graph TB
    subgraph "Analytics Features"
        Country[Country<br/>Statistics]
        Yearly[Yearly<br/>Breakdowns]
        Streaks[Travel<br/>Streaks]
        Budget[Safe Travel<br/>Budget]
        Proj[Eligibility<br/>Projections]
    end
    
    subgraph "Risk Assessment"
        Trip[Trip Risk<br/>Analysis]
        Pattern[Pattern<br/>Detection]
        Recom[Smart<br/>Recommendations]
    end
    
    Country --> Report[Annual<br/>Summary<br/>Report]
    Yearly --> Report
    Streaks --> Report
    Budget --> Trip
    Proj --> Trip
    Trip --> Pattern
    Pattern --> Recom
```

## Data Flow Architecture

### Overall Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Mobile as Mobile App
    participant Shared as Shared Library
    participant Storage as Local Storage
    
    User->>Mobile: Enter Trip Data
    Mobile->>Shared: Validate with Zod Schema
    Shared-->>Mobile: Validation Result
    
    alt Valid Data
        Mobile->>Storage: Save Trip
        Mobile->>Shared: Calculate Presence
        Shared->>Shared: Apply USCIS Rules
        Shared->>Shared: Check Compliance
        Shared->>Shared: Assess Risks
        Shared-->>Mobile: Comprehensive Status
        Mobile->>User: Display Results
    else Invalid Data
        Mobile->>User: Show Validation Errors
    end
```

### Calculation Pipeline

```mermaid
graph LR
    subgraph "Stage 1: Validation"
        V1[Date Validation]
        V2[Trip Validation]
        V3[Profile Validation]
    end
    
    subgraph "Stage 2: Core Calculations"
        C1[Physical Presence]
        C2[Continuous Residence]
        C3[Trip Duration]
    end
    
    subgraph "Stage 3: Analysis"
        A1[Risk Assessment]
        A2[Pattern Analysis]
        A3[Compliance Check]
    end
    
    subgraph "Stage 4: Recommendations"
        R1[Travel Budget]
        R2[Action Items]
        R3[Projections]
    end
    
    V1 --> C1
    V2 --> C1
    V3 --> C1
    C1 --> A1
    C2 --> A1
    C3 --> A1
    A1 --> R1
    A2 --> R2
    A3 --> R3
```

## Key Algorithms and Calculations

### 1. USCIS Day Counting Algorithm

```typescript
// Pseudocode representation
function calculateDaysAbroad(trip) {
    const tripDuration = endDate - startDate + 1
    
    // USCIS Rule: Departure and return days count as presence in USA
    if (departureDate !== returnDate) {
        return tripDuration - 2
    } else {
        return 0 // Same-day trip
    }
}
```

### 2. Overlapping Trip Deduplication

```mermaid
graph TB
    subgraph "Problem: Overlapping Trips"
        T1[Trip 1: Jan 1-10]
        T2[Trip 2: Jan 5-15]
        Overlap[Days 5-10 counted twice?]
    end
    
    subgraph "Solution: Set-Based Deduplication"
        Set[Day Set Structure]
        Add1[Add Jan 1-10 to Set]
        Add2[Add Jan 5-15 to Set]
        Result[Set prevents duplicates<br/>Accurate count: 15 days]
    end
    
    T1 --> Set
    T2 --> Set
    Set --> Add1
    Add1 --> Add2
    Add2 --> Result
```

### 3. Risk Assessment Thresholds

```mermaid
graph LR
    subgraph "Risk Levels by Days Abroad"
        Safe[0-149 days<br/>✅ Safe]
        Warning[150-179 days<br/>⚠️ Warning]
        Presumption[180-364 days<br/>🔴 Presumption]
        Loss[365+ days<br/>❌ Automatic Loss]
    end
    
    Safe --> Warning
    Warning --> Presumption
    Presumption --> Loss
    
    subgraph "Mitigation"
        Permit[Reentry Permit<br/>Extends to 730 days]
        N470[N-470 Exemption<br/>Protects residence]
    end
    
    Presumption -.-> Permit
    Presumption -.-> N470
```

## Schema Design and Validation

### Zod Schema Architecture

```mermaid
graph TD
    subgraph "Core Schemas"
        User[UserProfileSchema]
        Trip[TripSchema]
        Presence[PresenceSchema]
        Compliance[ComplianceSchema]
    end
    
    subgraph "Validation Features"
        Runtime[Runtime Validation]
        Type[TypeScript Types]
        Error[Error Messages]
        Transform[Data Transform]
    end
    
    subgraph "Benefits"
        Safety[Type Safety]
        Contract[API Contract]
        Docs[Self-Documenting]
    end
    
    User --> Runtime
    Trip --> Runtime
    Runtime --> Type
    Runtime --> Error
    Type --> Safety
    Error --> Contract
    Transform --> Docs
```

### Schema Example: Trip Validation

```typescript
const TripSchema = z.object({
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    location: z.string().optional(),
}).refine(
    data => new Date(data.returnDate) >= new Date(data.departureDate),
    { message: 'Return date must be after departure date' }
);
```

## Module Organization

### Directory Structure

```mermaid
graph TD
    subgraph "Shared Package Structure"
        Root[@usa-presence/shared]
        
        subgraph "Source"
            Schemas[schemas/]
            BL[business-logic/]
            Constants[constants/]
            Utils[utils/]
        end
        
        subgraph "Business Logic"
            Calc[calculations/]
            Presence[presence/]
            Compliance[compliance/]
            LPR[lpr-status/]
            Analytics[travel-analytics/]
            Risk[travel-risk/]
            Report[reporting/]
        end
    end
    
    Root --> Source
    BL --> Calc
    Calc --> Presence
    Calc --> Compliance
    Calc --> LPR
    Calc --> Analytics
    Calc --> Risk
    Calc --> Report
```

### Import Hierarchy

```mermaid
graph BT
    subgraph "Layer 1: Utilities"
        DateHelpers[date-helpers]
        TripCalc[trip-calculations]
        Validation[validation]
    end
    
    subgraph "Layer 2: Constants"
        USCIS[uscis-rules]
        CompConst[compliance]
        TimeConst[date-time]
    end
    
    subgraph "Layer 3: Schemas"
        UserSchema[user schemas]
        TripSchema[trip schemas]
        CompSchema[compliance schemas]
    end
    
    subgraph "Layer 4: Business Logic"
        PresenceCalc[presence calculator]
        ComplianceCoord[compliance coordinator]
        RiskAssess[risk assessment]
    end
    
    DateHelpers --> PresenceCalc
    TripCalc --> PresenceCalc
    USCIS --> PresenceCalc
    UserSchema --> PresenceCalc
    TripSchema --> PresenceCalc
    PresenceCalc --> ComplianceCoord
    ComplianceCoord --> RiskAssess
```

## Technical Design Decisions

### 1. UTC-First Date Handling

**Decision**: All dates stored and calculated in UTC

**Rationale**:
- Avoids timezone ambiguity
- Consistent calculations across timezones
- USCIS uses calendar days, not hours

```mermaid
graph LR
    subgraph "Date Input"
        Local[Local Date<br/>2024-01-01]
        TZ[User Timezone<br/>PST/EST/etc]
    end
    
    subgraph "Storage"
        UTC[UTC Date<br/>2024-01-01T00:00:00Z]
    end
    
    subgraph "Calculation"
        Days[Day Counting<br/>in UTC]
        Compare[Date Comparison<br/>in UTC]
    end
    
    Local --> UTC
    TZ -.-> UTC
    UTC --> Days
    UTC --> Compare
```

### 2. Functional Programming Approach

**Decision**: Pure functions with no side effects

**Benefits**:
- Predictable behavior
- Easy testing
- Cacheable results
- Concurrent execution

### 3. Monorepo with Shared Package

**Decision**: Single shared package for all business logic

**Advantages**:
- Single source of truth
- Consistent calculations across platforms
- Easier maintenance
- Type safety across boundaries

## Integration Points

### Mobile App Integration

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Shared as Shared Library
    participant Cache as Local Cache
    
    App->>Shared: getUserProfile()
    App->>Shared: getTrips()
    App->>Shared: calculateDaysOfPhysicalPresence()
    Shared-->>App: PresenceCalculationResult
    
    App->>Cache: Cache results
    
    App->>Shared: assessRiskOfLosingPermanentResidentStatus()
    Shared-->>App: LPRStatusAssessment
    
    App->>Shared: calculateComprehensiveCompliance()
    Shared-->>App: ComprehensiveComplianceStatus
    
    App->>Shared: generateAnnualTravelSummary()
    Shared-->>App: AnnualSummary
```

### API Integration (Optional Sync)

```mermaid
graph TB
    subgraph "Offline Mode"
        MobileOff[Mobile App]
        SharedOff[Shared Library]
        LocalDB[(SQLite)]
    end
    
    subgraph "Online Mode"
        MobileOn[Mobile App]
        SharedOn[Shared Library]
        API[NestJS API]
        CloudDB[(PostgreSQL)]
    end
    
    MobileOff --> SharedOff
    SharedOff --> LocalDB
    
    MobileOn --> SharedOn
    MobileOn -.-> API
    API --> CloudDB
    API --> SharedOn
```

## Testing Strategy

### Test Coverage by Domain

```mermaid
pie title Test Distribution
    "Presence Calculations" : 35
    "Compliance Tracking" : 25
    "LPR Status" : 20
    "Travel Analytics" : 15
    "Utilities" : 5
```

### Testing Approach

1. **Unit Tests**: All exported functions have comprehensive tests
2. **Edge Cases**: 200+ specific edge case tests
3. **USCIS Compliance**: Validate against official rules
4. **Integration Tests**: Test complete calculation flows
5. **Performance Tests**: Large dataset handling

### Test Categories

```mermaid
graph TD
    subgraph "Test Types"
        Unit[Unit Tests<br/>Pure function testing]
        Integration[Integration Tests<br/>Module interaction]
        Edge[Edge Cases<br/>Boundary conditions]
        Compliance[Compliance Tests<br/>USCIS rule validation]
        Performance[Performance Tests<br/>Large datasets]
    end
    
    subgraph "Coverage Goals"
        Functions[100% Function Coverage]
        Branches[>90% Branch Coverage]
        Rules[100% USCIS Rules]
    end
    
    Unit --> Functions
    Integration --> Functions
    Edge --> Branches
    Compliance --> Rules
```

## Performance Considerations

### Optimization Strategies

1. **Set-Based Deduplication**: O(n) instead of O(n²) for overlapping trips
2. **Early Validation**: Fail fast on invalid data
3. **Lazy Calculation**: Calculate only what's needed
4. **Memoization**: Cache expensive calculations
5. **Batch Processing**: Process multiple items together

### Performance Benchmarks

```mermaid
graph LR
    subgraph "Operation Benchmarks"
        Calc[Presence Calculation<br/>< 10ms for 1000 trips]
        Risk[Risk Assessment<br/>< 5ms per trip]
        Comp[Compliance Check<br/>< 20ms total]
        Report[Annual Report<br/>< 50ms generation]
    end
```

## Application Purpose and User Journey

### What the Application Does

The USA Presence Calculator helps Lawful Permanent Residents (green card holders) track their eligibility for U.S. citizenship by:

1. **Tracking Physical Presence**: Monitors days spent in the USA vs. abroad
2. **Ensuring Continuous Residence**: Warns about trips that could reset eligibility
3. **Managing Compliance**: Reminds about critical deadlines and requirements
4. **Assessing Risk**: Evaluates travel patterns for green card abandonment risk
5. **Providing Guidance**: Offers personalized recommendations and projections

### User Journey Flow

```mermaid
graph TD
    Start[User Opens App] --> Profile[Create Profile<br/>Enter Green Card Date]
    Profile --> Category[Select Path<br/>3-year or 5-year]
    
    Category --> Dashboard[View Dashboard<br/>Current Status]
    
    Dashboard --> AddTrip[Log Trips<br/>Manual or OCR]
    Dashboard --> Simulate[Simulate Future Trips]
    Dashboard --> Calendar[View Calendar]
    Dashboard --> Report[Generate Reports]
    
    AddTrip --> Calculate[Real-time Calculations]
    Simulate --> Calculate
    
    Calculate --> Status[Updated Status]
    Status --> Notify[Notifications<br/>Milestones & Warnings]
    
    Status --> Risk{Risk Level?}
    Risk -->|Safe| Continue[Continue Tracking]
    Risk -->|Warning| Recommend[View Recommendations]
    Risk -->|High| Alert[Urgent Actions]
    
    Continue --> Dashboard
    Recommend --> Dashboard
    Alert --> Legal[Seek Legal Advice]
```

### Key User Scenarios

1. **New LPR**: Just received green card, wants to understand requirements
2. **Frequent Traveler**: Business traveler needing to maintain status
3. **Family Abroad**: Balancing US presence with family obligations
4. **Near Eligibility**: Approaching naturalization, needs precise tracking
5. **At Risk**: Extended absence, needs immediate guidance

## Security and Privacy

### Data Protection Measures

```mermaid
graph TB
    subgraph "Security Layers"
        Bio[Biometric Auth<br/>Face/Touch ID]
        Encrypt[AES Encryption<br/>Local Storage]
        NoCloud[No Cloud Storage<br/>Privacy First]
        Export[Encrypted Export<br/>JSON Backup]
    end
    
    subgraph "Privacy Principles"
        Local[All Data Local]
        Optional[Optional Sync Only]
        Minimal[Minimal Collection]
        User[User Controlled]
    end
    
    Bio --> Encrypt
    Encrypt --> NoCloud
    NoCloud --> Export
    
    Local --> User
    Optional --> User
    Minimal --> User
```

## Future Extensibility

### Planned Enhancements

1. **Multi-Language Support**: Expand beyond English/Spanish
2. **Family Tracking**: Support multiple family members
3. **Document Management**: Store travel documents
4. **AI Predictions**: Machine learning for better projections
5. **Legal Integration**: Direct attorney consultations

### Extension Points

```mermaid
graph TD
    subgraph "Current Core"
        Shared[Shared Library]
        Mobile[Mobile App]
    end
    
    subgraph "Future Extensions"
        Web[Web Dashboard]
        API[Sync API]
        ML[ML Service]
        Docs[Document Service]
        Legal[Legal Network]
    end
    
    Shared --> Web
    Shared --> API
    API --> ML
    API --> Docs
    API --> Legal
    
    style Shared fill:#f9f,stroke:#333,stroke-width:4px
    style Mobile fill:#bbf,stroke:#333,stroke-width:2px
    style Web stroke-dasharray: 5 5
    style API stroke-dasharray: 5 5
    style ML stroke-dasharray: 5 5
```

## Conclusion

The USA Presence Calculator's shared library represents a sophisticated implementation of complex immigration law requirements, delivered through clean architecture and robust engineering practices. By maintaining strict separation of concerns, comprehensive testing, and user-focused design, the system provides accurate, reliable guidance for one of life's most important journeys - the path to U.S. citizenship.

The architecture's strength lies in its:
- **Accuracy**: Strict USCIS compliance
- **Reliability**: Extensive testing and validation
- **Usability**: Complex rules made simple
- **Maintainability**: Clean, modular design
- **Extensibility**: Ready for future growth

This technical foundation ensures that users can trust the application with their immigration journey, providing peace of mind through precision and clarity.