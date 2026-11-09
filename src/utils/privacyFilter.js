// src/utils/privacyFilter.js
// Comprehensive Privacy & Sensitive Data Filter for HUSH AI
// Masks phone numbers, emails, profanity, abusive terms, financial IDs, and sensitive words with asterisks (***)

const SENSITIVE_WORDS = [
  // English Profanity & Slurs
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'fck', 'fuk',
  'shit', 'shitty', 'shitting', 'bullshit',
  'bitch', 'bitches', 'bitching',
  'asshole', 'assholes', 'dumbass', 'jackass', 'arse', 'arsehole',
  'bastard', 'bastards',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',
  'cunt', 'cunts',
  'cock', 'cocks', 'cocksucker',
  'whore', 'whores',
  'slut', 'sluts',
  'nigger', 'nigga', 'niggers', 'niggas',
  'faggot', 'faggots',
  'retard', 'retarded',
  'nude', 'nudes', 'porn', 'porno', 'pornography', 'boobs',

  // Hinglish / Indian slurs & curse words
  'chutiya', 'chutiye', 'chutia', 'choot', 'chootia', 'chodu',
  'madarchod', 'madarchodh', 'mc',
  'bhenchod', 'behenchod', 'bc',
  'bhosdike', 'bhosadike', 'bhosadi', 'bhosda',
  'gandu', 'gaand', 'gand', 'gaandu',
  'lodu', 'lauda', 'lawda', 'lund', 'laude',
  'harami', 'kamina', 'kamine',
  'randi', 'raand',
  'kutti', 'kutta', 'suar', 'haramkhor'
];

// Sort descending by length so longer phrases/words match first
SENSITIVE_WORDS.sort((a, b) => b.length - a.length);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build pre-compiled word regex with word boundaries
const WORDS_REGEX = new RegExp(`\\b(${SENSITIVE_WORDS.map(escapeRegExp).join('|')})\\b`, 'gi');

// Email regex
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// UPI ID handles (e.g. rohan@oksbi, payment@paytm)
const UPI_REGEX = /\b[a-zA-Z0-9.\-_]{2,30}@(upi|okhdfcbank|okaxis|okicici|oksbi|paytm|ybl|ibl|axl)\b/gi;

// Credit / Debit card (16 digits)
const CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

// Aadhaar card (12 digits grouped 4-4-4)
const AADHAAR_REGEX = /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g;

// Password / OTP patterns (e.g. "otp: 481920", "password: mySecret123")
const OTP_PASSWORD_REGEX = /\b(otp|password|passcode|pin)([\s:=]+)([a-zA-Z0-9!@#$%^&*]{4,})\b/gi;

// Spaced-out phone number digits (e.g. "9 8 7 6 5 4 3 2 1 0")
const SPACED_DIGITS_REGEX = /\b(?:\d[\s.-]){9,}\d\b/g;

// Phone number regex with optional +91, 0, spaces, hyphens, dots
// Matches 10-12 digits in various groupings (e.g. +91 9876543210, 98765-43210, 9876543210)
const PHONE_REGEX = /(?:(?:\+91|0)[\s-]?)?[6-9]\d{1,5}[\s.-]?\d{2,5}[\s.-]?\d{2,5}\b/g;

// Fallback 10-12 continuous digits (card or phone)
const LONG_DIGITS_REGEX = /\b\d{10,12}\b/g;

/**
 * Masks sensitive data (phone numbers, emails, profanity, abusive terms) in text with asterisks (***).
 * @param {string} text - Raw input text
 * @returns {{ original: string, masked: string, hasSensitiveData: boolean, matchesCount: number }}
 */
export function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') {
    return {
      original: text || '',
      masked: text || '',
      hasSensitiveData: false,
      matchesCount: 0
    };
  }

  let masked = text;
  let matchesCount = 0;

  // 1. Mask Email Addresses
  masked = masked.replace(EMAIL_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 2. Mask UPI ID Handles
  masked = masked.replace(UPI_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 3. Mask Credit/Debit Card numbers
  masked = masked.replace(CARD_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 4. Mask Aadhaar numbers (12 digits 4-4-4)
  masked = masked.replace(AADHAAR_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 5. Mask Password & OTP disclosures
  masked = masked.replace(OTP_PASSWORD_REGEX, (_match, prefix, sep, secret) => {
    matchesCount++;
    return `${prefix}${sep}${'*'.repeat(secret.length)}`;
  });

  // 6. Mask Spaced-out phone numbers first (before standard phone numbers)
  masked = masked.replace(SPACED_DIGITS_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 7. Mask Standard / International Phone Numbers
  masked = masked.replace(PHONE_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      matchesCount++;
      return '*'.repeat(match.length);
    }
    return match;
  });

  // 8. Mask Long digit sequences (10-12 digits)
  masked = masked.replace(LONG_DIGITS_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  // 9. Mask Sensitive words & Profanity
  masked = masked.replace(WORDS_REGEX, (match) => {
    matchesCount++;
    return '*'.repeat(match.length);
  });

  return {
    original: text,
    masked,
    hasSensitiveData: matchesCount > 0,
    matchesCount
  };
}

/**
 * Quick helper to check if text contains sensitive data
 * @param {string} text
 * @returns {boolean}
 */
export function containsSensitiveData(text) {
  return maskSensitiveData(text).hasSensitiveData;
}
