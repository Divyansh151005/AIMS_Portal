/**
 * Parses student email to extract roll number, branch, and entry year
 * Example: 2023csb1119@iitrpr.ac.in
 * Returns: { rollNumber: '2023csb1119', branch: 'CSE', entryYear: 2023 }
 */
export const parseStudentEmail = (email) => {
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0]) {
    throw new Error('Invalid email format');
  }

  const rollNumber = parts[0].toLowerCase();
  
  // Extract entry year (first 4 digits)
  const yearMatch = rollNumber.match(/^(\d{4})/);
  if (!yearMatch) {
    throw new Error('Could not extract entry year from email');
  }
  const entryYear = parseInt(yearMatch[1]);

  // Extract branch code (typically 2-3 letters after year)
  // Pattern: YYYY[letters][numbers]
  const branchMatch = rollNumber.match(/^\d{4}([a-z]+)/);
  if (!branchMatch) {
    throw new Error('Could not extract branch from email');
  }
  
  const branchCode = branchMatch[1].toUpperCase();
  
  // Map common branch codes to full names
  const branchMap = {
    'CS': 'CSE',
    'CSE': 'CSE',
    'EE': 'EE',
    'ME': 'ME',
    'CE': 'CE',
    'CH': 'CHE',
    'CHE': 'CHE',
    'BM': 'BME',
    'BME': 'BME',
    'MTH': 'MTH',
    'PH': 'PHY',
    'PHY': 'PHY',
    'HS': 'HS',
    'MS': 'MS',
  };

  const branch = branchMap[branchCode] || branchCode;

  return {
    rollNumber,
    branch,
    entryYear,
  };
};
