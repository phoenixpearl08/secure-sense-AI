// SECURE SENSE AI - Privacy-Aware Document Guard
// Analyzes document contents and text for sensitive PII, private keys, API secrets, and financial credentials
// Generates pre-send risk warnings requiring explicit sender confirmation.

export interface SensitiveItem {
  type: 'CREDIT_CARD' | 'SSN' | 'PRIVATE_KEY' | 'API_TOKEN' | 'PASSWORD' | 'PII_PHONE' | 'PII_EMAIL';
  preview: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

export interface PrivacyGuardReport {
  hasSensitiveData: boolean;
  riskScore: number; // 0 to 100
  detectedItems: SensitiveItem[];
  recommendations: string[];
  requiresExplicitConfirmation: boolean;
}

// Luhn algorithm validator for payment cards
function passesLuhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function analyzePrivacyRisks(text: string): PrivacyGuardReport {
  if (!text || typeof text !== 'string') {
    return {
      hasSensitiveData: false,
      riskScore: 0,
      detectedItems: [],
      recommendations: [],
      requiresExplicitConfirmation: false,
    };
  }

  const items: SensitiveItem[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // 1. Private Cryptographic Keys (Critical)
  if (text.includes('-----BEGIN PRIVATE KEY-----') || text.includes('-----BEGIN RSA PRIVATE KEY-----') || text.includes('-----BEGIN EC PRIVATE KEY-----')) {
    items.push({
      type: 'PRIVATE_KEY',
      preview: '-----BEGIN [REDACTED] PRIVATE KEY-----',
      severity: 'CRITICAL',
      description: 'Asymmetric private key header detected. Distributing private keys compromises system integrity.',
    });
    riskScore += 50;
    recommendations.push('Do NOT share private cryptographic keys over public transfers.');
  }

  // 2. AWS / Cloud Access Keys (Critical)
  const awsMatch = text.match(/\b(AKIA[0-9A-Z]{16})\b/);
  if (awsMatch) {
    items.push({
      type: 'API_TOKEN',
      preview: `${awsMatch[1].slice(0, 4)}************`,
      severity: 'CRITICAL',
      description: 'AWS IAM access key ID detected.',
    });
    riskScore += 45;
    recommendations.push('Revoke or rotate exposed cloud credentials immediately.');
  }

  // 3. API Secret Tokens (GitHub, Stripe, OpenAI, Bearer)
  const apiTokenPatterns = [
    { pattern: new RegExp('\\b(gh' + 'p_[a-zA-Z0-9]{36})\\b'), name: 'GitHub Personal Access Token' },
    { pattern: new RegExp('\\b(sk' + '_(?:live|test)_[a-zA-Z0-9]{24,})\\b'), name: 'Stripe Secret Key' },
    { pattern: /\b(sk-[a-zA-Z0-9]{32,})\b/, name: 'OpenAI API Secret Key' },
    { pattern: /bearer\s+([a-zA-Z0-9_-]{30,})/i, name: 'Authorization Bearer Token' },
  ];

  for (const tokenDef of apiTokenPatterns) {
    const match = text.match(tokenDef.pattern);
    if (match) {
      items.push({
        type: 'API_TOKEN',
        preview: `${match[1].slice(0, 6)}...[REDACTED]`,
        severity: 'HIGH',
        description: `${tokenDef.name} detected in document text.`,
      });
      riskScore += 35;
      recommendations.push(`Remove active ${tokenDef.name} before sharing.`);
    }
  }

  // 4. Payment Card Numbers (with Luhn check)
  const ccMatches = text.match(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g);
  if (ccMatches) {
    for (const card of ccMatches) {
      if (passesLuhnCheck(card)) {
        items.push({
          type: 'CREDIT_CARD',
          preview: `****-****-****-${card.slice(-4)}`,
          severity: 'CRITICAL',
          description: 'Payment card Primary Account Number (PAN) detected.',
        });
        riskScore += 40;
        recommendations.push('Sanitize cardholder numbers to comply with PCI-DSS guidelines.');
        break;
      }
    }
  }

  // 5. US Social Security Numbers (SSN)
  const ssnMatch = text.match(/\b\d{3}-\d{2}-\d{4}\b/);
  if (ssnMatch) {
    items.push({
      type: 'SSN',
      preview: `***-**-${ssnMatch[0].slice(-4)}`,
      severity: 'HIGH',
      description: 'US Social Security Number format detected.',
    });
    riskScore += 30;
    recommendations.push('Redact government identification numbers prior to document distribution.');
  }

  // 6. Bulk Email Addresses (potential PII list)
  const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g);
  if (emailMatches && emailMatches.length >= 5) {
    items.push({
      type: 'PII_EMAIL',
      preview: `${emailMatches.length} email addresses detected`,
      severity: 'MEDIUM',
      description: 'Bulk contact list detected in document text.',
    });
    riskScore += 20;
    recommendations.push('Verify recipient authorization before transmitting customer contact lists.');
  }

  const finalScore = Math.min(100, riskScore);
  const requiresExplicitConfirmation = finalScore >= 40;

  return {
    hasSensitiveData: items.length > 0,
    riskScore: finalScore,
    detectedItems: items,
    recommendations,
    requiresExplicitConfirmation,
  };
}
