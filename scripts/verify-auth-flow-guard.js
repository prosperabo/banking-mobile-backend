const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectRoot = path.resolve(__dirname, '..');
const authServicePath = path.join(
  projectRoot,
  'src',
  'services',
  'auth.service.ts'
);
const authServiceSource = fs.readFileSync(authServicePath, 'utf8');

const normalLoginSectionStart = authServiceSource.indexOf(
  'private static async getBackofficeJwtData('
);
const normalLoginSectionEnd = authServiceSource.indexOf(
  'static async initializeCustomerConnectionToken('
);

assert(normalLoginSectionStart >= 0, 'Missing getBackofficeJwtData function');
assert(
  normalLoginSectionEnd > normalLoginSectionStart,
  'Missing restricted initialization function'
);

const normalLoginSection = authServiceSource.slice(
  normalLoginSectionStart,
  normalLoginSectionEnd
);

assert(
  !normalLoginSection.includes('getCustomerConnectionToken('),
  'Normal login flow must not call getCustomerConnectionToken'
);
assert(
  normalLoginSection.includes('refreshCustomerToken('),
  'Normal login flow must call refreshCustomerToken'
);
assert(
  normalLoginSection.includes(
    "avoidedEndpoint: 'get-customer-connection-token'"
  ),
  'Normal login flow must log that get-customer-connection-token was avoided'
);
assert(
  authServiceSource.includes('static async initializeCustomerConnectionToken('),
  'Restricted initialization flow for getCustomerConnectionToken must exist'
);

console.log('Auth flow guard passed.');
