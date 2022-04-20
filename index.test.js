const process = require('process');
const cp = require('child_process');
const path = require('path');
const { fail } = require('assert');

const getErrorOutput = (error) => {
  const output = Array(...error.output)
    .filter((line) => !!line)
    .map((line) => line.toString().replace(/%0A/g, '\n'))
    .filter((line) => line.trim().length > 0)
    .join('\n');
  return output;
};

const setDefaultInputs = () => {
  process.env['INPUT_PATH'] = './coverage/lcov.info';
  process.env['INPUT_MIN_COVERAGE'] = 100;
  process.env['INPUT_EXCLUDE'] = '';
  process.env['INPUT_GITHUB_TOKEN'] = '';
  process.env['INPUT_REPORT_COVERAGE_COMMENT'] = false;
  process.env['INPUT_PROJECT_NAME'] = '';
};

beforeEach(setDefaultInputs);

test('empty LCOV throws an error', () => {
  const lcovPath = './fixtures/lcov.empty.info';
  process.env['INPUT_PATH'] = lcovPath;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env });
    fail('this code should fail');
  } catch (err) {
    expect(err).toBeDefined();

    const errorMessage = err.stdout.toString();
    expect(errorMessage).toContain('lcov is empty!');
  }
});

test('invalid LCOV format throws an error', () => {
  const lcovPath = './fixtures/lcov.error.info';
  process.env['INPUT_PATH'] = lcovPath;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env }).toString();
    fail('this code should fail');
  } catch (err) {
    expect(err).toBeDefined();

    const errorMessage = err.stdout.toString();
    expect(errorMessage).toContain('parsing error!');
  }
});

test('completes when the coverage is 100 and min_coverage is not provided', () => {
  const lcovPath = './fixtures/lcov.100.info';
  process.env['INPUT_PATH'] = lcovPath;
  const ip = path.join(__dirname, 'index.js');
  cp.execSync(`node ${ip}`, { env: process.env }).toString();
});

test('completes when the coverage is higher than the threshold after excluding files', () => {
  const lcovPath = './fixtures/lcov.100.info';
  const exclude = '**/*_observer.dart';
  process.env['INPUT_PATH'] = lcovPath;
  process.env['INPUT_EXCLUDE'] = exclude;
  const ip = path.join(__dirname, 'index.js');
  cp.execSync(`node ${ip}`, { env: process.env }).toString();
});

test('fails when the coverage is not 100 and min_coverage is not provided', () => {
  const lcovPath = './fixtures/lcov.95.info';
  process.env['INPUT_PATH'] = lcovPath;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env }).toString();
    fail('this code should fail');
  } catch (err) {
    expect(err).toBeDefined();
    const errorMessage = err.stdout.toString();
    expect(errorMessage).toContain('95.0 is less than min_coverage 100');
  }
});

test('fails when the coverage is below the min_coverage, even if we exclude files', () => {
  const lcovPath = './fixtures/lcov.95.info';
  const exclude = '**/does_not_exist.dart';
  process.env['INPUT_PATH'] = lcovPath;
  process.env['INPUT_EXCLUDE'] = exclude;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env }).toString();
    fail('this code should fail');
  } catch (err) {
    expect(err).toBeDefined();
    const errorMessage = err.stdout.toString();
    expect(errorMessage).toContain('95.0 is less than min_coverage 100');
  }
});

test('completes when the coverage is above the given min_threshold', () => {
  const lcovPath = './fixtures/lcov.95.info';
  const minCoverage = 80;
  process.env['INPUT_PATH'] = lcovPath;
  process.env['INPUT_MIN_COVERAGE'] = minCoverage;
  const ip = path.join(__dirname, 'index.js');
  cp.execSync(`node ${ip}`, { env: process.env }).toString();
});

test('fails when the coverage is below the given min_threshold', () => {
  const lcovPath = './fixtures/lcov.95.info';
  const minCoverage = 98;
  process.env['INPUT_PATH'] = lcovPath;
  process.env['INPUT_MIN_COVERAGE'] = minCoverage;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env }).toString();
    fail('this code should fail');
  } catch (err) {
    expect(err).toBeDefined();
    const errorMessage = err.stdout.toString();
    expect(errorMessage).toContain('95.0 is less than min_coverage 98');
  }
});

test('shows lines that are missing coverage when failure occurs', () => {
  const lcovPath = './fixtures/lcov.95.info';
  process.env['INPUT_PATH'] = lcovPath;
  const ip = path.join(__dirname, 'index.js');
  try {
    cp.execSync(`node ${ip}`, { env: process.env }).toString();
    fail('this code should fail');
  } catch (err) {
    const output = getErrorOutput(err);
    expect(output).toContain('Lines not covered');
    expect(output).toContain(
      '/Users/felix/Development/github.com/felangel/bloc/packages/bloc/lib/src/bloc_observer.dart: 20, 27, 36, 43, 51'
    );
  }
});

test('creates comment when flag is set to true', () => {
  const lcovPath = './fixtures/lcov.100.info';
  const githubToken = 'githubToken';
  process.env['INPUT_PATH'] = lcovPath;
  process.env['INPUT_GITHUB_TOKEN'] = githubToken;
  process.env['INPUT_REPORT_COVERAGE_COMMENT'] = true;
  const ip = path.join(__dirname, 'index.js');
  cp.execSync(`node ${ip}`, { env: process.env }).toString();
});