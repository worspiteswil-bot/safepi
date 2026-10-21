import QRCode from 'qrcode';

/**
 * Utility for generating high-contrast, scan-friendly QR Codes
 * for electronic document validation in compliance with NR-6 and Portaria MTP 2.175/2022.
 */
export async function generateQRCodeDataUrl(text: string, size = 180): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: size,
      color: {
        dark: '#0f172a', // slate-900 for high scannability
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('Erro ao gerar imagem de QR code:', err);
    return '';
  }
}

/**
 * Generates an SVG string of the QR Code (useful for responsive vector rendering)
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('Erro ao gerar SVG de QR code:', err);
    return '';
  }
}
