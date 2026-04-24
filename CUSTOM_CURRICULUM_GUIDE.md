# FormEase G7 Special - Custom Curriculum Configuration Guide

## Overview

This is a specialized version of FormEase G7 designed to support schools with **custom curricula** that include additional subjects beyond the standard DepEd list.

### What's New?

✅ **School-Level Curriculum Customization** - Each school can define their own subject list  
✅ **Support for Extra Subjects** - Easily add subjects like "Specialization" or any custom subject  
✅ **Dynamic Form Rendering** - SF9 and SF10 forms automatically adapt to school's curriculum  
✅ **Backward Compatible** - Schools without custom config use standard DepEd subjects automatically  

---

## Your Customer's Setup

Your customer's curriculum structure:

```
Grade 7-10 Subjects:
1. Filipino
2. English
3. Mathematics
4. Science
5. Araling Panlipunan (AP)
6. Values Education
7. Technology and Livelihood Education (TLE)
8. MAPEH
9. Music and Arts (component)
10. Physical Education and Health (component)
11. Specialization ← CUSTOM SUBJECT
```

---

## How to Configure Custom Curriculum

### Method 1: Direct Database Configuration (Recommended)

In your school profile record, add a `curriculum` field with the following structure:

```json
{
  "school_id": "SCHOOL_001",
  "curriculum": {
    "school_id": "SCHOOL_001",
    "is_custom": true,
    "grade_7_subjects": [
      { "name": "Filipino", "code": "" },
      { "name": "English", "code": "" },
      { "name": "Mathematics", "code": "" },
      { "name": "Science", "code": "" },
      { "name": "Araling Panlipunan (AP)", "code": "" },
      { "name": "Values Education", "code": "" },
      { "name": "Technology and Livelihood Education (TLE)", "code": "" },
      { "name": "MAPEH", "code": "" },
      { "name": "Music and Arts", "code": "MAPEH" },
      { "name": "Physical Education and Health", "code": "MAPEH" },
      { "name": "Specialization", "code": "" }
    ],
    "grade_8_subjects": [
      { "name": "Filipino", "code": "" },
      { "name": "English", "code": "" },
      { "name": "Mathematics", "code": "" },
      { "name": "Science", "code": "" },
      { "name": "Araling Panlipunan (AP)", "code": "" },
      { "name": "Values Education", "code": "" },
      { "name": "Technology and Livelihood Education (TLE)", "code": "" },
      { "name": "MAPEH", "code": "" },
      { "name": "Music and Arts", "code": "MAPEH" },
      { "name": "Physical Education and Health", "code": "MAPEH" },
      { "name": "Specialization", "code": "" }
    ],
    "grade_9_subjects": [
      { "name": "Filipino", "code": "" },
      { "name": "English", "code": "" },
      { "name": "Mathematics", "code": "" },
      { "name": "Science", "code": "" },
      { "name": "Araling Panlipunan (AP)", "code": "" },
      { "name": "Values Education", "code": "" },
      { "name": "Technology and Livelihood Education (TLE)", "code": "" },
      { "name": "MAPEH", "code": "" },
      { "name": "Music and Arts", "code": "MAPEH" },
      { "name": "Physical Education and Health", "code": "MAPEH" },
      { "name": "Specialization", "code": "" }
    ],
    "grade_10_subjects": [
      { "name": "Filipino", "code": "" },
      { "name": "English", "code": "" },
      { "name": "Mathematics", "code": "" },
      { "name": "Science", "code": "" },
      { "name": "Araling Panlipunan (AP)", "code": "" },
      { "name": "Values Education", "code": "" },
      { "name": "Technology and Livelihood Education (TLE)", "code": "" },
      { "name": "MAPEH", "code": "" },
      { "name": "Music and Arts", "code": "MAPEH" },
      { "name": "Physical Education and Health", "code": "MAPEH" },
      { "name": "Specialization", "code": "" }
    ]
  }
}
```

### Configuration Notes

- **`code` field**: Leave empty for main subjects, use "MAPEH" for Music/Arts and PE/Health components
- **`is_custom` flag**: Set to `true` to enable custom curriculum
- **Grade-specific subjects**: You can have different subjects for different grades if needed
- **Ordering**: Subjects appear in the order you define them in the arrays

---

## Technical Changes Made

### New Files Created

1. **`app/src/lib/subjectConfig.ts`** - Subject configuration utility
   - `getSubjectsForGrade()` - Retrieves subjects for a grade level
   - `getSF10RowsForGrade()` - Formats subjects for SF10 rendering
   - `getSF9SubjectsForGrade()` - Formats subjects for SF9 rendering

### Modified Files

1. **`app/src/types/index.ts`**
   - Added `CurriculumSubject` interface
   - Added `SchoolCurriculum` interface
   - Extended `SchoolProfile` with optional `curriculum` field

2. **`app/src/pages/SF9Page.tsx`**
   - Updated `computeStudentGrades()` to use dynamic subject config
   - Updated `SF9Pages` component to render custom subjects
   - All SF9 forms now adapt to school's curriculum

3. **`app/src/components/SF10SpecRenderer.tsx`**
   - Updated to use `getSF10RowsForGrade()` for dynamic subject rendering
   - SF10 forms now adapt to school's curriculum

4. **`app/src/utils/sf10Mapper.ts`**
   - Updated `getStandardJhsSubjects()` to support custom curriculum
   - Updated `blankSubjects()` to generate keys for custom subjects

### New .bat Files (Separate App Variant)

- **`START_DEV_G7SPECIAL.bat`** - Development server on port 3002 (doesn't conflict with standard app)
- **`BUILD_EXE_G7SPECIAL.bat`** - Build executable for this special variant

---

## Usage Instructions

### For Development

Use the dedicated development file:
```bash
START_DEV_G7SPECIAL.bat
```

This runs on **http://localhost:3002** (separate from standard FormEase G7 which runs on 3001)

### For Production

Build using:
```bash
BUILD_EXE_G7SPECIAL.bat
```

The generated EXE will be in `app/release/`

### Testing the Feature

1. Set up school profile with custom curriculum in database
2. Create grades for students in all subjects including "Specialization"
3. Generate SF9/SF10 forms - they will automatically show all 11 subjects
4. Verify grades are correctly calculated and displayed

---

## Fallback Behavior

**If no custom curriculum is configured:**
- App automatically uses standard DepEd subject list (10 subjects)
- Ensures backward compatibility with existing schools
- No configuration needed - plug and play

---

## Troubleshooting

### Forms not showing custom subjects?

- ✓ Verify `curriculum` field exists in school profile
- ✓ Check that `is_custom` is set to `true`
- ✓ Ensure grade-specific subject arrays are populated

### Extra rows appearing blank in forms?

- This is normal - the form auto-pads to 12 rows for standard page layout
- Blank rows can be used for notes or future subjects

### Subjects not matching grades?

- Ensure subject records in database have correct `grade_level` field
- The app uses fuzzy matching to connect database subjects to form subjects
- Subject names are normalized (case-insensitive, special char handling)

---

## Support & Customization

For additional customization or support with:
- Different subject arrangements per grade
- Specialized grading calculations
- Additional school-specific fields

Please contact the development team with specific requirements.

---

## Version Information

- **Base Version**: FormEase G7 v1.0.1
- **Special Variant**: Custom Curriculum Support
- **Database Version**: Requires extended SchoolProfile schema
- **Compatibility**: Works with existing student and grading data

---

Generated: 2026-04-24
