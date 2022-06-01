/**
 * @param {boolean} expression
 */
export function assertEq(got, expected) {
  if (got != expected) {
    throw new Error('\n\tExpected: ' + expected + '\n\tGot: ' + got)
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
    console.log(e.message);
    return;
  }
  console.log(' ✓');
}
