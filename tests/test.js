/**
 * @param {boolean} expression
 */
export function assertEq(got, expected) {
  if (got !== expected) {
    throw new Error('\n\tExpected: ' + expected 
                  + '\n\tGot:      ' + got)
  } else {
    process.stdout.write('.');
  }
}

/**
 * @param {string} statement
 * @param {Function} test case function
 */
export function test(statement, testCase) {
  process.stdout.write(statement + ': ');
  try {
    testCase();
  } catch (e) {
    console.log(e.message ?? e);
    return;
  }
  console.log(' ✓');
}

/**
 * @param {string} statement
 * @param {Function} test case function
 */
export function batchTests(batchStatement, testCases) {
  console.log(`${batchStatement}: ${testCases.length} tests`);
  let failCount = 0;
  for (const [s, t] of testCases) {
    try {
      const res = t();
      process.stdout.write('✓');
    } catch (e) {
      ++failCount;
      console.log('');
      process.stdout.write(s + ': ');
      if (e.message) {
        console.log(e.message);
      } else {
        console.log('\n\t' + e);
      }
    }
  }
  if (failCount === 0) {
    console.log('');
    console.log(`All ${testCases.length} tests passed!`);
  } else {
    console.log('');
    console.log(`${failCount}/${testCases.length} tests failed...`);
  }
}
