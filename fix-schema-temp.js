const fs = require('fs');

// Read the file
let content = fs.readFileSync('server/lib/dapp-discovery.ts', 'utf8');

// Remove all incorrectly placed defi fields (those without proper indentation)
content = content.replace(/^\s{6}defiSecurityScore: null,\n\s{6}defiAuditReports: null,\n\s{6}defiHasMultisig: null,\n\s{6}defiHasTimelock: null,\n\s{6}defiDataFetchedAt: null,\n/gm, '');

// Now add them correctly after featuredPosition with proper indentation
// For objects in the main function (10 spaces indentation)
content = content.replace(/^(\s{10})featuredPosition: null,\n/gm, '$1featuredPosition: null,\n$1defiSecurityScore: null,\n$1defiAuditReports: null,\n$1defiHasMultisig: null,\n$1defiHasTimelock: null,\n$1defiDataFetchedAt: null,\n');

// For fallback protocols and test drainer protocols (8 spaces indentation)
content = content.replace(/^(\s{8})featuredPosition: null,\n(\s{7}})(?!,\s*\n\s{8}defi)/gm, '$1featuredPosition: null,\n$1defiSecurityScore: null,\n$1defiAuditReports: null,\n$1defiHasMultisig: null,\n$1defiHasTimelock: null,\n$1defiDataFetchedAt: null,\n$2');

fs.writeFileSync('server/lib/dapp-discovery.ts', content);
console.log('Fixed schema fields!');
