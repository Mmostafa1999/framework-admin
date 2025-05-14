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

export interface ControlRow {
  controlId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  dimension: string;
}

/**
 * Parse Excel or CSV file for control data
 */
export async function parseExcelFile(file: File): Promise<ControlRow[]> {
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
        
        // Map to expected control structure
        const controls = rawRows.map((row: any) => {
          return {
            controlId: row.controlId || row.id || '',
            nameEn: row.nameEn || row.name_en || row.name || '',
            nameAr: row.nameAr || row.name_ar || '',
            descriptionEn: row.descriptionEn || row.description_en || row.description || '',
            descriptionAr: row.descriptionAr || row.description_ar || '',
            dimension: (row.dimension || '').toLowerCase()
          };
        });
        
        resolve(controls);
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
 * Import controls from parsed data to Firestore
 */
export async function importControlsToFirestore(
  frameworkId: string,
  domainId: string, 
  controls: ControlRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: controls.length,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  for (const control of controls) {
    try {
      // Skip rows without ID or name
      if (!control.controlId || (!control.nameEn && !control.nameAr)) {
        result.errors.push(`Skipped row: Missing control ID or name`);
        result.failedCount += 1;
        continue;
      }

      // Validate dimension
      const dimension = control.dimension?.toLowerCase();
      if (dimension !== "plan" && dimension !== "implement" && dimension !== "operate") {
        result.errors.push(`Invalid dimension for control ${control.controlId}: '${control.dimension}'. Must be one of: plan, implement, operate`);
        result.failedCount += 1;
        continue;
      }

      // Check if control with this ID already exists
      const controlRef = doc(db, `frameworks/${frameworkId}/domains/${domainId}/controls`, control.controlId);
      const controlSnapshot = await getDoc(controlRef);
      
      if (controlSnapshot.exists()) {
        result.errors.push(`Control with ID "${control.controlId}" already exists`);
        result.failedCount += 1;
        continue;
      }

      // Create control with specific ID
      await setDoc(controlRef, {
        name: {
          en: control.nameEn,
          ar: control.nameAr
        },
        description: {
          en: control.descriptionEn,
          ar: control.descriptionAr
        },
        dimension: dimension as "plan" | "implement" | "operate"
      });

      result.successCount += 1;
    } catch (error) {
      console.error(`Error importing control ${control.controlId}:`, error);
      result.errors.push(`Failed to import control ${control.controlId}`);
      result.failedCount += 1;
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Generate and download a template Excel file for controls
 */
export function downloadControlTemplate() {
  // Create template headers
  const templateData = [
    {
      controlId: "CTRL-001",
      nameEn: "Example Control Name",
      nameAr: "اسم التحكم كمثال",
      descriptionEn: "Description of the control in English",
      descriptionAr: "وصف التحكم باللغة العربية",
      dimension: "plan" // Valid values: plan, implement, operate
    }
  ];

  // Convert to worksheet
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  
  // Add column widths for better visibility
  const columnWidths = [
    { wch: 12 }, // controlId
    { wch: 25 }, // nameEn
    { wch: 25 }, // nameAr
    { wch: 40 }, // descriptionEn
    { wch: 40 }, // descriptionAr
    { wch: 15 }, // dimension
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Controls Template");

  // Download
  XLSX.writeFile(workbook, "controls_import_template.xlsx");
} 