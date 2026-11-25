/**
 * BillBook Invoice Preferences, Palettes & Formatting Utilities
 * Synchronizes invoice template settings between backend API and AsyncStorage,
 * and provides color helpers & Indian currency word conversion.
 */

import storage from './storage';
import invoiceService from '../services/invoiceService';

const INVOICE_PREFS_STORAGE_KEY = 'billbook_invoice_prefs_v1';

export const DEFAULT_INVOICE_PREFS = {
  templateId: 1,
  primaryColor: '#0A2540',
  accentColor: '#F58220',
  invoiceTitle: 'TAX INVOICE',
  density: 'standard', // 'standard' | 'compact'
  showLogo: true,
  showCustomerDetails: true,
  showDiscount: true,
  showAmountInWords: true,
  showSignature: true,
  showTerms: true,
  showThankYou: true,
  termsText: 'Goods once sold cannot be returned or exchanged.',
  footerMessage: 'Thank you for your business!',
  signatureUrl: '',
};

export const INVOICE_TEMPLATES = [
  {
    id: 1,
    name: 'Modern Slate',
    tagline: 'Bold full-bleed banner header, tinted info cards & vibrant total pill.',
    badge: 'Popular',
    layoutLabel: 'Banner + Cards',
  },
  {
    id: 2,
    name: 'Classic Corporate',
    tagline: 'Formal white letterhead with boxed stamp & full grid table borders.',
    badge: 'Formal',
    layoutLabel: 'Grid Ledger',
  },
  {
    id: 3,
    name: 'Creative Accent',
    tagline: 'Vertical left accent stripe, floating chips & bold highlight summary.',
    badge: 'Creative',
    layoutLabel: 'Side Stripe',
  },
  {
    id: 4,
    name: 'Thermal POS Receipt',
    tagline: 'Centered narrow thermal receipt with dashed rules & invoice barcode.',
    badge: 'POS Fast',
    layoutLabel: '80mm Receipt',
  },
  {
    id: 5,
    name: 'Minimalist Clean',
    tagline: 'Airy editorial whitespace with crisp typographic accent lines.',
    badge: 'Minimal',
    layoutLabel: 'Editorial',
  },
  {
    id: 6,
    name: 'Executive Detailed',
    tagline: 'Double-framed tax invoice with 3-column metadata & itemized breakdown.',
    badge: 'Enterprise',
    layoutLabel: 'Framed Tax',
  },
];

export const PRIMARY_COLOR_PRESETS = [
  '#0A2540', // BillBook Deep Navy
  '#1E293B', // Slate Charcoal
  '#1D4ED8', // Royal Blue
  '#047857', // Emerald Forest
  '#6D28D9', // Deep Violet
  '#B91C1C', // Crimson
  '#0E7490', // Deep Teal
  '#9A3412', // Burnt Sienna
  '#312E81', // Indigo
  '#0F172A', // Midnight
];

export const ACCENT_COLOR_PRESETS = [
  '#F58220', // BillBook Brand Orange
  '#10B981', // Emerald Mint
  '#3B82F6', // Sky Blue
  '#8B5CF6', // Electric Purple
  '#EF4444', // Coral Red
  '#F59E0B', // Amber Gold
  '#06B6D4', // Cyan
  '#EC4899', // Magenta Pink
  '#14B8A6', // Teal
  '#0A2540', // Deep Navy
];

export const COLOR_PAIR_THEMES = [
  { name: 'BillBook Classic', primary: '#0A2540', accent: '#F58220' },
  { name: 'Royal Sky', primary: '#1D4ED8', accent: '#06B6D4' },
  { name: 'Emerald Mint', primary: '#047857', accent: '#10B981' },
  { name: 'Violet Pulse', primary: '#6D28D9', accent: '#EC4899' },
  { name: 'Crimson Gold', primary: '#B91C1C', accent: '#F59E0B' },
  { name: 'Midnight Teal', primary: '#0F172A', accent: '#14B8A6' },
];

export const INVOICE_TITLE_OPTIONS = [
  'TAX INVOICE',
  'INVOICE',
  'BILL OF SUPPLY',
  'CASH MEMO',
];

export const normalizeHex = (hex, fallback = '#0A2540') => {
  if (!hex || typeof hex !== 'string') return fallback;
  let cleaned = hex.trim();
  if (!cleaned.startsWith('#')) cleaned = `#${cleaned}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(cleaned)) {
    const r = cleaned[1];
    const g = cleaned[2];
    const b = cleaned[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
};

export const isValidHex = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const cleaned = hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`;
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(cleaned);
};

export const hexToRgba = (hex, alpha = 1) => {
  const full = normalizeHex(hex, '#0A2540');
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatInvoiceCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export const numberToWordsIndian = (num) => {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees only';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convert = (n) => {
    let str = '';
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };
  return convert(num).replace(/\s+/g, ' ').trim() + ' Rupees only';
};

/**
 * Load local preferences from AsyncStorage
 */
export const getLocalInvoicePrefs = async () => {
  try {
    const raw = await storage.getItem(INVOICE_PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_INVOICE_PREFS, ...parsed };
    }
  } catch {
    // ignore parse error
  }
  return { ...DEFAULT_INVOICE_PREFS };
};

/**
 * Persist preferences locally to AsyncStorage
 */
export const saveLocalInvoicePrefs = async (prefs) => {
  try {
    const merged = { ...DEFAULT_INVOICE_PREFS, ...prefs };
    await storage.setItem(INVOICE_PREFS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return { ...DEFAULT_INVOICE_PREFS, ...prefs };
  }
};

/**
 * Load combined invoice preferences from backend + local storage.
 * Backend values take priority for template_id / primary_color / accent_color / signature_url
 * when present and non-empty; local storage fills all display options and acts as fallback.
 */
export const loadMergedInvoicePrefs = async ({ bypassCache = true } = {}) => {
  const localPrefs = await getLocalInvoicePrefs();
  try {
    const res = await invoiceService.getInvoiceSettings({ useCache: !bypassCache });
    if (res?.status && res?.data) {
      const s = res.data;
      const tid = parseInt(s.template_id || s.active_template_id || localPrefs.templateId || 1, 10);
      const merged = {
        ...localPrefs,
        templateId: Number.isFinite(tid) && tid >= 1 && tid <= 6 ? tid : localPrefs.templateId,
        primaryColor: s.primary_color ? normalizeHex(s.primary_color, localPrefs.primaryColor) : localPrefs.primaryColor,
        accentColor: s.accent_color ? normalizeHex(s.accent_color, localPrefs.accentColor) : localPrefs.accentColor,
        signatureUrl: s.signature_url !== undefined && s.signature_url !== null ? s.signature_url : localPrefs.signatureUrl,
      };
      await saveLocalInvoicePrefs(merged);
      return merged;
    }
  } catch {
    // fallback to local prefs
  }
  return localPrefs;
};

/**
 * Sample sale data for live template previews
 */
export const SAMPLE_PREVIEW_SALE = {
  id: 1024,
  invoice_number: 'INV-2026-042',
  sale_date: '25 Nov 2026',
  payment_mode: 'UPI / GPay',
  status: 'paid',
  customer_name: 'Aarav Patel',
  customer_phone: '9876543210',
  customer_address: '402, Titanium City Center, Satellite, Ahmedabad',
  subtotal: 6850,
  discount_amount: 350,
  grand_total: 6500,
  notes: 'Goods once sold cannot be returned or exchanged.',
  items: [
    {
      product_id: 101,
      product_name: 'Wireless Barcode Scanner Pro',
      quantity: 1,
      unit_price: 3450,
      discount: 200,
      line_total: 3250,
    },
    {
      product_id: 102,
      product_name: 'Thermal Billing Paper Roll (Pack of 10)',
      quantity: 2,
      unit_price: 850,
      discount: 50,
      line_total: 1650,
    },
    {
      product_id: 103,
      product_name: 'POS Cash Drawer Heavy Duty',
      quantity: 1,
      unit_price: 1700,
      discount: 100,
      line_total: 1600,
    },
  ],
};
