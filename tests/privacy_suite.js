// tests/privacy_suite.js
// Verification suite for sensitive data masking (phone numbers, emails, profanity, Hinglish slurs, financial & credentials)

import { maskSensitiveData } from '../src/utils/privacyFilter.js';

const testCases = [
  // 1. Phone numbers
  {
    input: "Call me at 9876543210 tonight",
    expectedMasked: "Call me at ********** tonight",
    shouldDetect: true,
    desc: "10-digit Indian phone number"
  },
  {
    input: "My WhatsApp is +91 9876543210 please ping",
    expectedMasked: "My WhatsApp is ************** please ping",
    shouldDetect: true,
    desc: "Phone with +91 country code"
  },
  {
    input: "Reach out at 98765-43210",
    expectedMasked: "Reach out at ***********",
    shouldDetect: true,
    desc: "Hyphenated phone number"
  },
  {
    input: "Secret digits: 9 8 7 6 5 4 3 2 1 0 okay",
    expectedMasked: "Secret digits: ******************* okay",
    shouldDetect: true,
    desc: "Spaced-out phone number digits"
  },

  // 2. Email addresses
  {
    input: "Send resume to rohan.dev@gmail.com please",
    expectedMasked: "Send resume to ******************* please",
    shouldDetect: true,
    desc: "Email address"
  },

  // 3. English swear words / Profanity & Slurs
  {
    input: "What the fuck is this bullshit",
    expectedMasked: "What the **** is this ********",
    shouldDetect: true,
    desc: "English profanity (fuck, bullshit)"
  },
  {
    input: "You are a bitch and an asshole",
    expectedMasked: "You are a ***** and an *******",
    shouldDetect: true,
    desc: "English abusive words (bitch, asshole)"
  },

  // 4. Hinglish / Indian slurs
  {
    input: "Tu chutiya hai kya behenchod",
    expectedMasked: "Tu ******* hai kya *********",
    shouldDetect: true,
    desc: "Hinglish curse words (chutiya, behenchod)"
  },
  {
    input: "Arre bhosdike lodu chal nikal",
    expectedMasked: "Arre ******** **** chal nikal",
    shouldDetect: true,
    desc: "Hinglish abusive terms (bhosdike, lodu)"
  },

  // 5. Financial & Credentials
  {
    input: "Pay me at rohan@oksbi or alex@paytm",
    expectedMasked: "Pay me at *********** or **********",
    shouldDetect: true,
    desc: "UPI IDs"
  },
  {
    input: "My secret otp: 492819 don't share",
    expectedMasked: "My secret otp: ****** don't share",
    shouldDetect: true,
    desc: "OTP disclosure"
  },
  {
    input: "Login password: mySecretKey2026",
    expectedMasked: "Login password: ***************",
    shouldDetect: true,
    desc: "Password disclosure"
  },
  {
    input: "Card number 4111-2222-3333-4444 expired",
    expectedMasked: "Card number ******************* expired",
    shouldDetect: true,
    desc: "Credit card number"
  },

  // 6. False positive checks (Innocent words MUST NOT be masked)
  {
    input: "I have an assignment on classical mechanics and passion",
    expectedMasked: "I have an assignment on classical mechanics and passion",
    shouldDetect: false,
    desc: "Innocent words containing 'ass' (assignment, classical, passion)"
  },
  {
    input: "I am 21 years old and my rank was 10 in college",
    expectedMasked: "I am 21 years old and my rank was 10 in college",
    shouldDetect: false,
    desc: "Normal numbers (21, 10)"
  },
  {
    input: "Let us discuss AI development, placements and coding projects!",
    expectedMasked: "Let us discuss AI development, placements and coding projects!",
    shouldDetect: false,
    desc: "Normal friendly conversation"
  }
];

console.log("====================================================");
console.log("  HUSH AI: Privacy & Sensitive Data Filter Test     ");
console.log("====================================================\n");

let passed = 0;

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const result = maskSensitiveData(tc.input);

  const maskedMatches = result.masked === tc.expectedMasked;
  const detectionMatches = result.hasSensitiveData === tc.shouldDetect;

  if (maskedMatches && detectionMatches) {
    console.log(`✅ TEST ${i + 1} PASSED (${tc.desc})`);
    console.log(`   Input:  "${tc.input}"`);
    console.log(`   Output: "${result.masked}"\n`);
    passed++;
  } else {
    console.error(`❌ TEST ${i + 1} FAILED (${tc.desc})`);
    console.error(`   Input:    "${tc.input}"`);
    console.error(`   Expected: "${tc.expectedMasked}" (detected: ${tc.shouldDetect})`);
    console.error(`   Got:      "${result.masked}" (detected: ${result.hasSensitiveData})\n`);
  }
}

console.log(`Summary: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
