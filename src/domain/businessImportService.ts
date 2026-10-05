import * as XLSX from 'xlsx';
import { Business, BusinessSource } from './types';

export interface RawImportRow {
  rowNumber: number;
  business_name?: any;
  category?: any;
  sub_category?: any;
  contact_person?: any;
  mobile?: any;
  whatsapp?: any;
  address?: any;
  area?: any;
  city?: any;
  state?: any;
  pincode?: any;
  remarks?: any;
  [key: string]: any;
}

export type RowValidationStatus = 'valid' | 'invalid' | 'possible_duplicate';

export interface ValidatedRow {
  rowNumber: number;
  status: RowValidationStatus;
  errors: string[];
  warnings: string[];
  duplicateOf?: {
    businessId: string;
    businessName: string;
    mobile: string;
    type: 'strong_mobile' | 'possible_name_city';
  };
  normalizedData?: {
    businessName: string;
    category: string;
    subCategory: string;
    contactPerson: string;
    mobile: string;
    whatsapp: string;
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    remarks: string;
  };
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: ValidatedRow[];
  invalidRows: ValidatedRow[];
  duplicateRows: ValidatedRow[];
  allRows: ValidatedRow[];
}

export const TEMPLATE_COLUMNS = [
  'business_name',
  'category',
  'sub_category',
  'contact_person',
  'mobile',
  'whatsapp',
  'address',
  'area',
  'city',
  'state',
  'pincode',
  'remarks',
];

export const SAMPLE_TEMPLATE_DATA = [
  {
    business_name: 'Patel Furniture Workshop',
    category: 'Furniture',
    sub_category: 'Handcrafted & Teak',
    contact_person: 'Rajesh Patel',
    mobile: '9825123456',
    whatsapp: '9825123456',
    address: 'Plot 12, Gondal Road, Near Samrat Gate',
    area: 'Gondal Road Industrial Area',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360004',
    remarks: 'Specialized in customized teak dining sets',
  },
  {
    business_name: 'Shreeji Hardware & Tools',
    category: 'Hardware',
    sub_category: 'Architectural Hardware',
    contact_person: 'Haresh Shah',
    mobile: '9825234567',
    whatsapp: '9825234567',
    address: 'Shop 4, Dhebar Road',
    area: 'Dhebar Chowk',
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360001',
    remarks: 'Wholesale and retail distributor',
  },
];

/**
 * Generates plain CSV template as string
 */
export function generateCsvTemplate(): string {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA, { header: TEMPLATE_COLUMNS });
  return XLSX.utils.sheet_to_csv(ws);
}

/**
 * Generates binary XLSX template Blob
 */
export function generateExcelTemplateBlob(): Blob {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_DATA, { header: TEMPLATE_COLUMNS });
  XLSX.utils.book_append_sheet(wb, ws, 'Businesses_Template');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Cleans and standardizes an Indian mobile phone number
 */
export function normalizeIndianMobile(raw: any): { valid: boolean; mobile: string; formatted: string } {
  if (raw === null || raw === undefined) {
    return { valid: false, mobile: '', formatted: '' };
  }
  const digits = String(raw).replace(/[^\d]/g, '');
  // Standard 10-digit format
  let tenDigit = '';
  if (digits.length === 10) {
    tenDigit = digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    tenDigit = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigit = digits.slice(1);
  }

  // Indian mobile numbers typically start with 6, 7, 8, or 9
  const isValid = tenDigit.length === 10 && /^[6-9]\d{9}$/.test(tenDigit);
  return {
    valid: isValid,
    mobile: tenDigit,
    formatted: tenDigit ? `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}` : '',
  };
}

/**
 * Validates 6-digit Indian PIN code if provided
 */
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return true; // optional
  const cleaned = pincode.trim().replace(/[^\d]/g, '');
  return cleaned.length === 6 && /^[1-9]\d{5}$/.test(cleaned);
}

/**
 * Parse an uploaded CSV or XLSX file
 */
export async function parseImportFile(file: File): Promise<RawImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, index) => ({
    ...row,
    rowNumber: index + 2, // Excel 1-based index (header is row 1)
  }));
}

/**
 * Validate parsed rows against required fields, formats, and duplicates
 */
export function validateImportRows(
  rawRows: RawImportRow[],
  existingBusinesses: Business[]
): ImportValidationResult {
  const validRows: ValidatedRow[] = [];
  const invalidRows: ValidatedRow[] = [];
  const duplicateRows: ValidatedRow[] = [];
  const allRows: ValidatedRow[] = [];

  // Build lookup index of existing mobile numbers and business names in lowercase
  const existingMobileMap = new Map<string, Business>();
  const existingNameCityMap = new Map<string, Business>();

  for (const b of existingBusinesses) {
    const norm = normalizeIndianMobile(b.phone || b.mobile);
    if (norm.valid) {
      existingMobileMap.set(norm.mobile, b);
    }
    const key = `${b.name.trim().toLowerCase()}_${b.city.trim().toLowerCase()}`;
    existingNameCityMap.set(key, b);
  }

  // Also track within-file mobile duplicates
  const fileSeenMobiles = new Set<string>();

  for (const row of rawRows) {
    const errors: string[] = [];
    const warnings: string[] = [];

    const businessName = String(row.business_name || row['Business Name'] || '').trim();
    const category = String(row.category || row['Category'] || '').trim();
    const subCategory = String(row.sub_category || row['Sub Category'] || row.subcategory || '').trim();
    const contactPerson = String(row.contact_person || row['Contact Person'] || '').trim();
    const rawMobile = row.mobile || row['Mobile'] || row.phone || '';
    const rawWhatsapp = row.whatsapp || row['WhatsApp'] || rawMobile;
    const address = String(row.address || row['Address'] || '').trim();
    const area = String(row.area || row['Area'] || '').trim();
    const city = String(row.city || row['City'] || '').trim();
    const state = String(row.state || row['State'] || 'Gujarat').trim();
    const pincode = String(row.pincode || row['Pincode'] || row['Pin Code'] || '').trim();
    const remarks = String(row.remarks || row['Remarks'] || '').trim();

    // 1. Required field validations
    if (!businessName) {
      errors.push('Business Name is required.');
    }
    if (!category) {
      errors.push('Category is required.');
    }
    if (!contactPerson) {
      errors.push('Contact Person is required.');
    }
    if (!address) {
      errors.push('Address is required.');
    }
    if (!city) {
      errors.push('City is required.');
    }

    // 2. Mobile validation
    const mobileCheck = normalizeIndianMobile(rawMobile);
    if (!rawMobile) {
      errors.push('Mobile number is required.');
    } else if (!mobileCheck.valid) {
      errors.push(`Invalid mobile format: "${rawMobile}". Must be a valid 10-digit Indian mobile number.`);
    }

    // 3. Pincode validation
    if (pincode && !isValidPincode(pincode)) {
      errors.push(`Invalid 6-digit Pincode: "${pincode}".`);
    }

    // 4. Duplicate checks
    let duplicateInfo: ValidatedRow['duplicateOf'] = undefined;
    if (mobileCheck.valid) {
      if (existingMobileMap.has(mobileCheck.mobile)) {
        const existing = existingMobileMap.get(mobileCheck.mobile)!;
        duplicateInfo = {
          businessId: existing.id || existing.businessId || 'UNKNOWN',
          businessName: existing.name || existing.businessName || '',
          mobile: existing.phone || existing.mobile || mobileCheck.mobile,
          type: 'strong_mobile',
        };
        warnings.push(`Same mobile as registered business: ${existing.name} (${existing.id})`);
      } else if (fileSeenMobiles.has(mobileCheck.mobile)) {
        warnings.push(`Duplicate mobile within this import file (${mobileCheck.mobile}).`);
      }
      fileSeenMobiles.add(mobileCheck.mobile);
    }

    // Check possible name + city match
    if (!duplicateInfo && businessName && city) {
      const key = `${businessName.toLowerCase()}_${city.toLowerCase()}`;
      if (existingNameCityMap.has(key)) {
        const existing = existingNameCityMap.get(key)!;
        duplicateInfo = {
          businessId: existing.id || existing.businessId || 'UNKNOWN',
          businessName: existing.name || existing.businessName || '',
          mobile: existing.phone || existing.mobile || '',
          type: 'possible_name_city',
        };
        warnings.push(`Same business name & city as: ${existing.name} (${existing.id})`);
      }
    }

    const whatsappCheck = normalizeIndianMobile(rawWhatsapp);

    const validatedRow: ValidatedRow = {
      rowNumber: row.rowNumber,
      status: errors.length > 0 ? 'invalid' : duplicateInfo ? 'possible_duplicate' : 'valid',
      errors,
      warnings,
      duplicateOf: duplicateInfo,
      normalizedData: {
        businessName,
        category,
        subCategory,
        contactPerson,
        mobile: mobileCheck.formatted || String(rawMobile),
        whatsapp: whatsappCheck.valid ? whatsappCheck.formatted : mobileCheck.formatted || '',
        address,
        area,
        city,
        state: state || 'Gujarat',
        pincode: pincode.replace(/[^\d]/g, ''),
        remarks,
      },
    };

    allRows.push(validatedRow);
    if (validatedRow.status === 'invalid') {
      invalidRows.push(validatedRow);
    } else if (validatedRow.status === 'possible_duplicate') {
      duplicateRows.push(validatedRow);
    } else {
      validRows.push(validatedRow);
    }
  }

  return {
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    duplicateRows,
    allRows,
  };
}

/**
 * Generates an Excel error report Blob for any invalid rows
 */
export function generateErrorReportBlob(
  invalidRows: ValidatedRow[]
): Blob {
  const errorData = invalidRows.map((r) => ({
    'Row Number': r.rowNumber,
    'Business Name': r.normalizedData?.businessName || '',
    'Mobile': r.normalizedData?.mobile || '',
    'Category': r.normalizedData?.category || '',
    'City': r.normalizedData?.city || '',
    'Error Reasons': r.errors.join(' | '),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(errorData);
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Errors');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Transforms a valid import row into a standard Business database entity.
 * SECURITY: Always sets verificationStatus = 'UNVERIFIED', status = 'ACTIVE'
 */
export function convertImportRowToBusiness(
  row: ValidatedRow,
  source: BusinessSource,
  creatorUid: string,
  importId: string
): Business {
  if (!row.normalizedData) {
    throw new Error(`Row ${row.rowNumber} has no normalized data.`);
  }

  const d = row.normalizedData;
  const businessId = `biz_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  return {
    id: businessId,
    businessId,
    ownerId: creatorUid,
    name: d.businessName,
    businessName: d.businessName,
    category: d.category,
    subcategory: d.subCategory || 'General',
    businessType: 'physical_store',
    description: d.remarks || `${d.category} merchant in ${d.city}`,
    phone: d.mobile,
    mobile: d.mobile,
    whatsapp: d.whatsapp || d.mobile,
    contactPerson: d.contactPerson,
    address: d.address,
    area: d.area,
    city: d.city,
    state: d.state,
    pincode: d.pincode,
    remarks: d.remarks,
    lat: 22.3039, // Default regional anchor for Rajkot/Gujarat until verified
    lng: 70.8022,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    logoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.businessName)}`,
    rating: 5.0,
    reviewCount: 0,
    openForChat: true,
    businessHours: {
      days: 'Mon - Sat',
      openTime: '09:00',
      closeTime: '20:00',
      isOpenToday: true,
    },
    responseMetrics: {
      avgResponseMinutes: 15,
      responseRatePct: 95,
      text: 'Usually replies within 15 min',
    },
    // CRITICAL SECURITY: Initial state is strictly UNVERIFIED!
    verificationStatus: 'UNVERIFIED',
    status: 'ACTIVE',
    source,
    createdBy: creatorUid,
    createdAt: nowIso,
    updatedAt: nowIso,
    importId,
    verification: {
      level: 0,
      status: 'draft',
      mobileVerified: false,
      locationVerified: false,
      businessDocVerified: false,
      reverificationRequired: false,
      lastVerifiedDate: nowIso.split('T')[0],
    },
    subscriptionTier: 'free',
    activeConversationsCount: 0,
    maxActiveConversations: 10,
    searchKeywords: [
      d.businessName.toLowerCase(),
      d.category.toLowerCase(),
      d.city.toLowerCase(),
      d.contactPerson.toLowerCase(),
    ],
  };
}
