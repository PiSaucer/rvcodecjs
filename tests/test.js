const log = console.log;
let TEST_FAILED = false;

/**
 * @param {boolean} expression
 */
export function assert(expression) {
    if(!TEST_FAILED)
    if (expression)
        return;
    else {
        log('\n\n');
        console.trace();
        log(`--Test failed--`);
        TEST_FAILED = true;

    };
}

/**
 * @param {string} statement
 * @param {Function} callback
 * @param {boolean} should_throw
 */
export function test(statement, callback, should_throw = false) {
    if (!TEST_FAILED) {
        callback();
    }
    if (!TEST_FAILED) {
        log('✔️   ', statement);
    }
}
