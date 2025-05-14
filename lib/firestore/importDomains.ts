import * as XLSX from 'xlsx-js-style';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface DomainRow {
  domainId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  domainFieldEn?: string;
  domainFieldAr?: string;
  defaultLang?: string;
}

/**
 * Parse Excel or CSV file for domain data
 */
export async function parseExcelFile(file: File): Promise<DomainRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json(worksheet);
        
        // Map to expected domain structure
        const domains = rawRows.map((row: any) => {
          return {
            domainId: row.domainId || row.id || '',
            nameEn: row.nameEn || row.name_en || row.name || '',
            nameAr: row.nameAr || row.name_ar || '',
            descriptionEn: row.descriptionEn || row.description_en || row.description || '',
            descriptionAr: row.descriptionAr || row.description_ar || '',
            domainFieldEn: row.domainFieldEn || row.domain_field_en || row.field_en || '',
            domainFieldAr: row.domainFieldAr || row.domain_field_ar || row.field_ar || '',
            defaultLang: row.defaultLang || row.default_lang || 'en'
          };
        });
        
        resolve(domains);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * Import domains from parsed data to Firestore
 */
export async function importDomainsToFirestore(
  frameworkId: string, 
  domains: DomainRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: domains.length,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  for (const domain of domains) {
    try {
      // Skip rows without ID or name
      if (!domain.domainId || (!domain.nameEn && !domain.nameAr)) {
        result.errors.push(`Skipped row: Missing domain ID or name`);
        result.failedCount += 1;
        continue;
      }

      // Check if domain with this ID already exists
      const domainRef = doc(db, `frameworks/${frameworkId}/domains`, domain.domainId);
      const domainSnapshot = await getDoc(domainRef);
      
      if (domainSnapshot.exists()) {
        result.errors.push(`Domain with ID "${domain.domainId}" already exists`);
        result.failedCount += 1;
        continue;
      }

      // Create domain with specific ID
      await setDoc(domainRef, {
        name: {
          en: domain.nameEn,
          ar: domain.nameAr
        },
        description: {
          en: domain.descriptionEn,
          ar: domain.descriptionAr
        },
        domainField: {
          en: domain.domainFieldEn || "",
          ar: domain.domainFieldAr || ""
        },
        defaultLang: domain.defaultLang || 'en'
      });

      result.successCount += 1;
    } catch (error) {
      console.error(`Error importing domain ${domain.domainId}:`, error);
      result.errors.push(`Failed to import domain ${domain.domainId}`);
      result.failedCount += 1;
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Generate and download a template Excel file for domains
 */
export function downloadDomainTemplate() {
  // Create template headers
  const templateData = [
    {
      domainId: "DOM-001",
      nameEn: "Example Domain Name",
      nameAr: "اسم المجال كمثال",
      descriptionEn: "Description of the domain in English",
      descriptionAr: "وصف المجال باللغة العربية",
      domainFieldEn: "Optional field in English",
      domainFieldAr: "حقل اختياري باللغة العربية",
      defaultLang: "en" // Valid values: en, ar
    }
  ];

  // Convert to worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Add column widths for better visibility
  const columnWidths = [
    { wch: 12 }, // domainId
    { wch: 25 }, // nameEn
    { wch: 25 }, // nameAr
    { wch: 40 }, // descriptionEn
    { wch: 40 }, // descriptionAr
    { wch: 25 }, // domainFieldEn
    { wch: 25 }, // domainFieldAr
    { wch: 12 }, // defaultLang
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Domains Template");

  // Download
  XLSX.writeFile(workbook, "domains_import_template.xlsx");
} 