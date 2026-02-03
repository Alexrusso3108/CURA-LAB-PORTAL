// Test the calculateStatus function
const calculateStatus = (value, referenceRange) => {
  if (!value || !referenceRange) return 'normal';

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'normal';

  // Extract numeric ranges from reference_range
  const rangeMatch = referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  const lessThanMatch = referenceRange.match(/<(\d+\.?\d*)/);
  const greaterThanMatch = referenceRange.match(/>(\d+\.?\d*)/);

  console.log('Testing:', { value, referenceRange, numValue, rangeMatch });

  if (rangeMatch) {
    const [, min, max] = rangeMatch;
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);

    console.log('Range:', { minVal, maxVal, numValue });

    if (numValue < minVal || numValue > maxVal) {
      if (numValue < minVal * 0.8 || numValue > maxVal * 1.2) {
        return 'critical';
      }
      return 'abnormal';
    }
  } else if (lessThanMatch) {
    const [, max] = lessThanMatch;
    const maxVal = parseFloat(max);
    if (numValue >= maxVal) {
      return numValue >= maxVal * 1.2 ? 'critical' : 'abnormal';
    }
  } else if (greaterThanMatch) {
    const [, min] = greaterThanMatch;
    const minVal = parseFloat(min);
    if (numValue <= minVal) {
      return numValue <= minVal * 0.8 ? 'critical' : 'abnormal';
    }
  }

  return 'normal';
};

// Test cases
console.log('Test 1 (29, "40 - 70"):', calculateStatus('29', '40 - 70')); // Should be 'critical' (29 < 40*0.8=32)
console.log('Test 2 (35, "40 - 70"):', calculateStatus('35', '40 - 70')); // Should be 'abnormal'
console.log('Test 3 (50, "40 - 70"):', calculateStatus('50', '40 - 70')); // Should be 'normal'
console.log('Test 4 (75, "40 - 70"):', calculateStatus('75', '40 - 70')); // Should be 'abnormal'
console.log('Test 5 (90, "40 - 70"):', calculateStatus('90', '40 - 70')); // Should be 'critical' (90 > 70*1.2=84)
