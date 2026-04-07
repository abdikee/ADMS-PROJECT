# Ethiopian Curriculum Grading System

## Overview

This system implements the Ethiopian General Secondary Education Certificate grading standards as defined by the Ministry of Education.

## Grading Scale

| Grade | Percentage Range | Description | Status |
|-------|-----------------|-------------|--------|
| **A** | 90.00 - 100.00% | Excellent | PASS |
| **B** | 80.00 - 89.99% | Very Good | PASS |
| **C** | 60.00 - 79.99% | Good | PASS |
| **D** | 50.00 - 59.99% | Satisfactory | PASS |
| **F** | 0.00 - 49.99% | Failure | FAIL |

## Key Points

- **Passing Mark:** 50%
- **Minimum Passing Grade:** D (50-59.99%)
- **Applies to:** Primary Education (Grades 1-8) and Secondary Education (Grades 9-12)

## Implementation

### Frontend

The grading logic is implemented in:
- `src/app/utils/ethiopianGrading.js` - Comprehensive grading utilities
- `src/app/utils/buildGrade.js` - Main grade calculation function
- `src/app/contexts/DataContext.jsx` - Student report calculations

### Backend

The grading logic is implemented in:
- `backend/controllers/reportController.js` - Student and class report generation
- `backend/controllers/marksController.js` - Marks entry and validation

## Usage Examples

### Calculate Grade from Marks

```javascript
import { buildGrade } from '@/utils/ethiopianGrading';

const grade = buildGrade(75, 100); // Returns 'C'
```

### Check Pass/Fail Status

```javascript
import { isPassing, getStatus } from '@/utils/ethiopianGrading';

const percentage = 55;
const passing = isPassing(percentage); // Returns true
const status = getStatus(percentage);  // Returns 'PASS'
```

### Get Grade Description

```javascript
import { getGradeDescription } from '@/utils/ethiopianGrading';

const description = getGradeDescription('B'); // Returns 'Very Good'
```

### Display Grading Scale

```javascript
import { getGradingScale } from '@/utils/ethiopianGrading';

const scale = getGradingScale();
// Returns array of all grade information
```

## Exam Weightage

The system uses the following weightage for calculating final grades:

- **Midterm:** 30%
- **Final:** 50%
- **Quiz:** 10%
- **Assignment:** 10%

**Total:** 100%

## References

- [Ethiopian Grading System - Scholaro](https://www.scholaro.com/pro/Countries/Ethiopia/Grading-System)
- [Ethiopian Education System - OpenEduCat](https://openeducat.org/gradebook/ethiopia/)
- Ethiopian Ministry of Education Standards

## Notes

- The system automatically calculates grades based on marks obtained and maximum marks
- Pass/fail status is determined by the 50% threshold
- All percentage calculations are rounded to 2 decimal places
- Grade calculations are consistent across student reports, class reports, and individual marks
