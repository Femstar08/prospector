# Targeting Improvements Summary

## Problem Solved

Getting too many low-potential results that weren't worth pursuing.

## Key Changes Made

### 1. Raised Quality Thresholds

- **minOverallScore**: 40-50 → 70 (40% increase)
- **minIntentScore**: 0 → 60 (for question askers)
- **minQuestionQuality**: 0 → 50 (for question askers)

### 2. Enhanced Scoring Weights

**Old weights** (too generous):

- business_alignment: 20%
- technical_synergy: 15%
- audience: 10%
- wealth_potential: 10%
- openness: 20%

**New weights** (quality-focused):

- business_alignment: 25% ↑
- wealth_potential: 20% ↑
- intent: 20% ↑
- openness: 15%
- technical_synergy: 10%

### 3. Stricter Intent Detection

- **Professional-seeking**: +30 points (was +25)
- **Budget mentioned**: +25 points (was +15)
- **Business problems**: +20 points (new)
- **Vague questions**: -20 points penalty (new)

### 4. Quality Gates for Question Askers

- High intent (80+) + good quality (60+): can score 15 points lower
- Medium intent (60+) + quality (50+): can score 10 points lower
- Low intent: must meet full threshold

### 5. Enhanced Question Quality Scoring

- **Business context**: +20 points for business terms
- **Length requirements**: More selective (300+ chars = +25)
- **Generic penalties**: -15 points for "anyone know", "quick question"

## Results Comparison

### Before (Low Targeting)

- 16 profiles → ~12-15 results
- Scores: 40-60 range
- Many vague, low-intent questions
- Mixed quality prospects

### After (High Targeting)

- 16 profiles → 4 results (75% filtered out)
- Scores: 74-75 range
- All 100% intent scores
- All actively seeking professionals

## Quality of Final 4 Results

1. **£115k earner** - Financial planning decision (£11k ISA vs debt)
2. **Property owner** - Legal/financial advice (freehold purchase)
3. **£50k+ investor** - Investment platform advice (crypto ETNs)
4. **Six-figure accountant** - Career consultation (international move)

## Impact

- **Precision**: 75% reduction in low-quality results
- **Quality**: All results are high-income, sophisticated prospects
- **Intent**: 100% are actively seeking professional advice
- **Relevance**: All have specific financial/business needs

The system now identifies genuine prospects with money and immediate needs, rather than casual question askers.
