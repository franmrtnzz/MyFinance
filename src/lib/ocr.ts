import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  warnings?: string[];
}

export const extractTextFromImage = async (file: File): Promise<OcrResult> => {
  try {
    const { data } = await Tesseract.recognize(file, 'spa', { logger: () => {} });
    let text = (data?.text || '').trim();
    if (!text) {
      const { data: dataEng } = await Tesseract.recognize(file, 'eng', { logger: () => {} });
      text = (dataEng?.text || '').trim();
    }
    return { text };
  } catch (e) {
    return { text: '', warnings: ['OCR failed'] };
  }
};

export interface ParsedTransactionFromOcr {
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  category?: string;
}

const parseEuroAmount = (str: string): number | null => {
  const match = str.replace(/\s/g, '').match(/([0-9]{1,3}(?:[\.,][0-9]{3})*|[0-9]+)(?:[\.,]([0-9]{1,2}))?\s*€?/);
  if (!match) return null;
  const integerPart = match[1].replace(/\./g, '').replace(/,/g, '');
  const decimalPart = match[2] ? match[2].padEnd(2, '0') : '00';
  const normalized = `${integerPart}.${decimalPart}`;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const inferTypeFromLine = (line: string): 'income' | 'expense' => {
  const compact = line.replace(/\s+/g, '');
  // Sign right before amount
  const plusNearAmount = /\+\s*\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2})?\s*€?/.test(compact);
  const minusNearAmount = /[\-−]\s*\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2})?\s*€?/.test(compact);
  if (plusNearAmount) return 'income';
  if (minusNearAmount) return 'expense';
  // Keyword hints (non-exhaustive)
  const l = line.toLowerCase();
  if (/(abono|inter[eé]s|n[oó]mina|ingreso)/.test(l)) return 'income';
  return 'expense';
};

export const parseOcrTextToTransactions = (text: string, defaultMonthIso: string): ParsedTransactionFromOcr[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedTransactionFromOcr[] = [];
  let detectedDate: string | null = null;

  // Detect dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  for (const line of lines) {
    let m = line.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (m) {
      const d = m[1].padStart(2, '0');
      const mth = m[2].padStart(2, '0');
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      detectedDate = `${y}-${mth}-${d}`;
      break;
    }
    // Detect dd/mm without year (e.g., 2/9)
    m = line.match(/(\d{1,2})[\/.\-](\d{1,2})(?![\/.\-]\d)/);
    if (m) {
      const today = new Date();
      const d = m[1].padStart(2, '0');
      const mth = m[2].padStart(2, '0');
      const y = today.getFullYear().toString();
      detectedDate = `${y}-${mth}-${d}`;
      break;
    }
  }

  const today = new Date();
  const [defYear, defMonth] = defaultMonthIso.split('-');
  const fallbackDate = `${defYear}-${defMonth}-${today.getDate().toString().padStart(2, '0')}`;

  // We parse each line that contains a numeric amount
  for (const line of lines) {
    const amount = parseEuroAmount(line);
    if (amount === null || amount <= 0) continue;

    const type = inferTypeFromLine(line);
    // Remove trailing amount and currency and signs from description
    const cleaned = line
      .replace(/\+\s*$/, '')
      .replace(/[\-−]\s*$/, '')
      .replace(/\s*[+\-−]?\s*\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2})?\s*€?\s*$/, '')
      .trim();

    const description = cleaned.length >= 3 ? cleaned.slice(0, 60) : 'Concepto no identificado';

    results.push({
      type,
      amount,
      date: detectedDate || fallbackDate,
      description,
      category: 'Otros',
    });
  }

  // If nothing parsed and text had a clear TOTAL, keep previous behavior to salvage one tx
  if (results.length === 0) {
    let totalAmount: number | null = null;
    for (const line of lines) {
      if (/total/i.test(line) || /importe/i.test(line) || /a\s*pagar/i.test(line)) {
        const amt = parseEuroAmount(line);
        if (amt !== null) {
          totalAmount = amt;
          break;
        }
      }
    }
    if (totalAmount !== null) {
      const header = lines.slice(0, 3).join(' ').slice(0, 60);
      results.push({
        type: 'expense',
        amount: totalAmount,
        date: detectedDate || fallbackDate,
        description: header || 'Concepto no identificado',
        category: 'Otros',
      });
    }
  }

  return results;
}; 