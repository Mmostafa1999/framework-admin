import * as XLSX from 'xlsx-js-style';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CapabilityLevel, convertLegacyCapabilityLevel } from '@/hooks/useSpecifications';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: { row: number; error: string }[];
}

export interface SpecificationRow {
  specificationId?: string;
  number: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  dependency_en?: string;
  dependency_ar?: string;
  capabilityLevel: CapabilityLevel | string | number;
  subSpecs?: { 
    name_en: string, 
    name_ar: string, 
    description_en?: string, 
    description_ar?: string 
  }[];
  version?: string;
  versionDate?: string;
  versionNote_en?: string;
  versionNote_ar?: string;
}

/**
 * Generate an Excel template for specifications import
 */
export function generateSpecificationsTemplate(): Blob {
  // Define the template headers and sample row
  const headers = [
    'specificationId',
    'number',
    'name_en',
    'name_ar',
    'description_en',
    'description_ar',
    'dependency_en',
    'dependency_ar',
    'capabilityLevel',
    'version',
    'versionDate',
    'versionNote_en',
    'versionNote_ar',
    'subSpec1_name_en',
    'subSpec1_name_ar',
    'subSpec1_description_en',
    'subSpec1_description_ar',
    'subSpec2_name_en',
    'subSpec2_name_ar',
    'subSpec2_description_en',
    'subSpec2_description_ar',
  ];

  // Sample data row
  const sampleRow = {
    specificationId: 'spec123',
    number: 'AC-1.1',
    name_en: 'Sample Specification Name',
    name_ar: 'اسم المواصفات النموذجية',
    description_en: 'This is a sample specification description',
    description_ar: 'هذا وصف المواصفات النموذجية',
    dependency_en: 'Sample dependency',
    dependency_ar: 'التبعية النموذجية',
    capabilityLevel: 'foundational',  // Updated to use string-based capability level
    version: 'v1.0',
    versionDate: new Date().toISOString().split('T')[0],
    versionNote_en: 'Initial version',
    versionNote_ar: 'الإصدار الأولي',
    subSpec1_name_en: 'Sample Sub-Specification 1',
    subSpec1_name_ar: 'المواصفات الفرعية النموذجية 1',
    subSpec1_description_en: 'Description for sub-specification 1',
    subSpec1_description_ar: 'وصف المواصفات الفرعية 1',
    subSpec2_name_en: 'Sample Sub-Specification 2',
    subSpec2_name_ar: 'المواصفات الفرعية النموذجية 2',
    subSpec2_description_en: 'Description for sub-specification 2',
    subSpec2_description_ar: 'وصف المواصفات الفرعية 2',
  };

  // Create a worksheet
  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });

  // Create a workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Specifications');

  // Generate buffer
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  
  // Convert to Blob
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parse Excel file for specification data
 */
export async function parseExcelFile(file: File): Promise<{ data: SpecificationRow[], errors: { row: number; error: string }[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);
        const validatedRows: SpecificationRow[] = [];
        const errors: { row: number; error: string }[] = [];
        
        // Validate each row
        rawRows.forEach((row, index) => {
          const rowErrors = validateSpecificationRow(row);
          
          if (rowErrors.length === 0) {
            // Process the basic specification data
            const specRow: SpecificationRow = {
              specificationId: row.specificationId || '',
              number: row.number || '',
              name_en: row.name_en || '',
              name_ar: row.name_ar || '',
              description_en: row.description_en || '',
              description_ar: row.description_ar || '',
              dependency_en: row.dependency_en || '',
              dependency_ar: row.dependency_ar || '',
              capabilityLevel: parseCapabilityLevel(row.capabilityLevel),
              version: row.version || '',
              versionDate: row.versionDate || '',
              versionNote_en: row.versionNote_en || '',
              versionNote_ar: row.versionNote_ar || '',
              subSpecs: []
            };
            
            // Process sub-specifications
            // Look for subSpec1_name_en, subSpec1_name_ar, etc.
            for (let i = 1; i <= 5; i++) { // Support up to 5 sub-specs
              const nameEnKey = `subSpec${i}_name_en`;
              const nameArKey = `subSpec${i}_name_ar`;
              const descEnKey = `subSpec${i}_description_en`;
              const descArKey = `subSpec${i}_description_ar`;
              
              if (row[nameEnKey] || row[nameArKey]) {
                specRow.subSpecs?.push({
                  name_en: row[nameEnKey] || '',
                  name_ar: row[nameArKey] || '',
                  description_en: row[descEnKey] || '',
                  description_ar: row[descArKey] || ''
                });
              }
            }
            
            validatedRows.push(specRow);
          } else {
            rowErrors.forEach(error => {
              errors.push({ row: index + 2, error }); // +2 to account for header and 1-indexed rows
            });
          }
        });
        
        resolve({ data: validatedRows, errors });
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
 * Validate a specification row
 */
function validateSpecificationRow(row: any): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!row.number) errors.push('Missing required field: number');
  if (!row.name_en && !row.name_ar) errors.push('Missing required field: name (either English or Arabic is required)');
  
  // Validate capability level
  const level = row.capabilityLevel;
  if (level !== undefined && level !== null) {
    // Check if it's a valid string value
    if (typeof level === 'string') {
      const normalizedLevel = level.toLowerCase();
      if (
        normalizedLevel !== 'foundational' && 
        normalizedLevel !== 'advanced' && 
        normalizedLevel !== 'veryadvanced' &&
        normalizedLevel !== 'very advanced' &&
        // Allow Arabic translations
        normalizedLevel !== 'اساسيه' && 
        normalizedLevel !== 'متقدمه' && 
        normalizedLevel !== 'متقدمه جدا' &&
        // Allow legacy numeric values
        isNaN(parseInt(level, 10))
      ) {
        errors.push('Invalid capability level: must be one of: foundational, advanced, very advanced (or numeric 1-5)');
      }
    } 
    // Numeric values are also accepted and converted
    else if (typeof level === 'number' && (level < 1 || level > 5)) {
      errors.push('Invalid capability level: if using numeric levels, must be between 1 and 5');
    }
  }
  
  return errors;
}

/**
 * Parse capability level value and convert to standard string format
 */
function parseCapabilityLevel(value: any): CapabilityLevel {
  // If no value, default to foundational
  if (value === undefined || value === null) {
    return 'foundational';
  }
  
  // If it's already a valid capability level string, return it
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    
    // Handle English values
    if (lowerValue === 'foundational') return 'foundational';
    if (lowerValue === 'advanced') return 'advanced';
    if (lowerValue === 'veryadvanced' || lowerValue === 'very advanced') return 'veryAdvanced';
    
    // Handle Arabic values
    if (lowerValue === 'اساسيه') return 'foundational';
    if (lowerValue === 'متقدمه') return 'advanced';
    if (lowerValue === 'متقدمه جدا') return 'veryAdvanced';
  }

  // Use the conversion function for other cases (legacy numeric values or strings containing numbers)
  return convertLegacyCapabilityLevel(value);
}

/**
 * Import specifications from parsed data to Firestore
 */
export async function importSpecificationsToFirestore(
  controlId: string,
  frameworkId: string,
  domainId: string,
  specifications: SpecificationRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: specifications.length,
    successCount: 0,
    failedCount: 0,
    errors: []
  };

  const now = new Date().toISOString();

  for (let i = 0; i < specifications.length; i++) {
    const spec = specifications[i];
    try {
      // Skip rows without number or name
      if (!spec.number || (!spec.name_en && !spec.name_ar)) {
        result.errors.push({ 
          row: i + 2, 
          error: `Skipped row: Missing specification number or name`
        });
        result.failedCount += 1;
        continue;
      }

      // Process sub-specifications
      const subSpecifications = spec.subSpecs?.map(subSpec => ({
        name: {
          en: subSpec.name_en || '',
          ar: subSpec.name_ar || ''
        },
        description: {
          en: subSpec.description_en || '',
          ar: subSpec.description_ar || ''
        }
      })) || [];

      // Process version history
      const versionHistory = [];
      if (spec.version) {
        versionHistory.push({
          version: spec.version,
          date: spec.versionDate || now.split('T')[0],
          note: {
            en: spec.versionNote_en || '',
            ar: spec.versionNote_ar || ''
          }
        });
      }

      // Format the specification for Firestore
      const specificationData = {
        controlId,
        number: spec.number,
        name: {
          en: spec.name_en || '',
          ar: spec.name_ar || ''
        },
        description: {
          en: spec.description_en || '',
          ar: spec.description_ar || ''
        },
        dependency: {
          en: spec.dependency_en || '',
          ar: spec.dependency_ar || ''
        },
        capabilityLevel: parseCapabilityLevel(spec.capabilityLevel),
        subSpecifications: subSpecifications,
        versionHistory: versionHistory,
        createdAt: now,
        updatedAt: now
      };

      // Add to Firestore using the nested path
      const specificationsPath = `frameworks/${frameworkId}/domains/${domainId}/controls/${controlId}/specifications`;
      
      // Use the specification number as the document ID
      const specificationId = spec.number;
      const specificationRef = doc(db, specificationsPath, specificationId);
      
      // Remove the controlId since it's implied by the path
      const { controlId: _, ...dataWithoutControlId } = specificationData;
      
      await setDoc(specificationRef, dataWithoutControlId);
      result.successCount += 1;
    } catch (error) {
      console.error(`Error importing specification ${spec.number}:`, error);
      result.errors.push({ 
        row: i + 2, 
        error: `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      result.failedCount += 1;
    }
  }

  result.success = result.failedCount === 0 && result.successCount > 0;
  return result;
} 