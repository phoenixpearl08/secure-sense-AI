// RealityVault AI - Cryptographic QR Code Generator
// Rule: QR Codes encode ONLY secure non-enumerable access URLs or tokens.
// Never encode plaintext secrets, passwords, OTPs, or decryption keys.

import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(accessUrl: string): Promise<string> {
  if (!accessUrl || typeof accessUrl !== 'string') {
    throw new Error('Valid URL or token required for QR generation');
  }

  try {
    return await QRCode.toDataURL(accessUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
      color: {
        dark: '#06b6d4', // Cyan accent
        light: '#030712', // Dark background
      },
    });
  } catch (err) {
    throw new Error(`Failed to generate QR code: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function generateQrCodeSvg(accessUrl: string): Promise<string> {
  if (!accessUrl || typeof accessUrl !== 'string') {
    throw new Error('Valid URL or token required for QR generation');
  }

  try {
    return await QRCode.toString(accessUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#06b6d4',
        light: '#030712',
      },
    });
  } catch (err) {
    throw new Error(`Failed to generate QR SVG: ${err instanceof Error ? err.message : String(err)}`);
  }
}
