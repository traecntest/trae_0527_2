module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        'utils/**/*.js',
        'controllers/**/*.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov']
};
