import React, { useState, useRef } from 'react';
import { Business, BusinessImportRecord } from '../../domain/types';
import {
  generateCsvTemplate,
  generateExcelTemplateBlob,
  parseImportFile,
  validateImportRows,
  generateErrorReportBlob,
  convertImportRowToBusiness,
  ImportValidationResult,
  ValidatedRow,
} from '../../domain/businessImportService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBusinesses: Business[];
  onImportConfirm: (businesses: Business[], importRecord: BusinessImportRecord) => Promise<void>;
  currentUserId: string;
  currentUserName?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  existingBusinesses,
  onImportConfirm,
  currentUserId,
  currentUserName,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'xlsx'>('csv');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [skipExactDuplicates, setSkipExactDuplicates] = useState(true);
  const [includePossibleDuplicates, setIncludePossibleDuplicates] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle template downloads
  const handleDownloadCsvTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sampark_businesses_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcelTemplate = () => {
    const blob = generateExcelTemplateBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sampark_businesses_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult || validationResult.invalidRows.length === 0) return;
    const blob = generateErrorReportBlob(validationResult.invalidRows);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import_errors_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step 1: File selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      setParseError('Please upload a valid .csv or .xlsx file.');
      return;
    }

    setSelectedFile(file);
    setFileType(ext === 'csv' ? 'csv' : 'xlsx');
    setParseError(null);

    // Auto-parse & validate
    setParsing(true);
    try {
      const rawRows = await parseImportFile(file);
      if (rawRows.length === 0) {
        setParseError('The uploaded file contains no data rows.');
        setParsing(false);
        return;
      }

      const validated = validateImportRows(rawRows, existingBusinesses);
      setValidationResult(validated);
      setStep('preview');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Please verify format.');
    } finally {
      setParsing(false);
    }
  };

  // Confirm Import
  const handleExecuteImport = async () => {
    if (!validationResult || !selectedFile) return;

    setImporting(true);
    try {
      const source = fileType === 'xlsx' ? 'EXCEL_IMPORT' : 'CSV_IMPORT';
      const importId = `IMP-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();

      // Determine rows to import based on duplicate settings
      const candidateRows: ValidatedRow[] = [
        ...validationResult.validRows,
        ...(skipExactDuplicates ? [] : validationResult.exactDuplicateRows),
        ...(includePossibleDuplicates ? validationResult.possibleDuplicateRows : []),
      ];

      const businessEntities = candidateRows.map((r) =>
        convertImportRowToBusiness(r, source, currentUserId || 'admin_user', importId)
      );

      const skippedCount =
        validationResult.invalidRows.length +
        (skipExactDuplicates ? validationResult.exactDuplicateRows.length : 0) +
        (includePossibleDuplicates ? 0 : validationResult.possibleDuplicateRows.length);

      const importRecord: BusinessImportRecord = {
        importId,
        fileName: selectedFile.name,
        fileType,
        totalRows: validationResult.totalRows,
        validRows: validationResult.validRows.length,
        invalidRows: validationResult.invalidRows.length,
        duplicateRows: validationResult.duplicateRows.length,
        importedRows: businessEntities.length,
        skippedRows: skippedCount,
        uploadedBy: currentUserId || 'admin_user',
        uploadedByName: currentUserName || 'Platform Administrator',
        createdAt: nowIso,
        status: validationResult.invalidRows.length > 0 ? 'partial' : 'completed',
        errors: validationResult.invalidRows.map((r) => ({
          row: r.rowNumber,
          businessName: r.normalizedData?.businessName,
          reason: r.errors.join(', '),
        })),
      };

      await onImportConfirm(businessEntities, importRecord);

      setImportedCount(businessEntities.length);
      setStep('success');
    } catch (err: any) {
      setParseError(err.message || 'Failed to complete import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet size={22} className="text-emerald-300" />
            <div>
              <h2 className="font-bold text-base leading-tight">Bulk Import Businesses</h2>
              <p className="text-[11px] text-emerald-200">
                Excel / CSV Ingestion · Status: <span className="font-semibold text-amber-200">Mandatory UNVERIFIED</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-700/60 rounded-full text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Alert Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-amber-700 shrink-0" />
            <span>
              <strong>Integrity Guard:</strong> Bulk import populates unverified database records only. Verification trust badges cannot be assigned via import spreadsheets.
            </span>
          </div>
        </div>

        {/* STEP 1: UPLOAD & TEMPLATE SELECTION */}
        {step === 'upload' && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h3 className="font-bold text-base text-gray-900">Upload Predefined Spreadsheet</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Download the standardized Sampark template, populate your business directory rows, and upload either CSV or Excel (.xlsx) file.
              </p>
            </div>

            {/* Template Download Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-left transition-colors flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 group-hover:text-emerald-800">Download CSV Template</h4>
                  <p className="text-[11px] text-gray-500">Plain comma-delimited format</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-left transition-colors flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900 group-hover:text-emerald-800">Download Excel Template</h4>
                  <p className="text-[11px] text-gray-500">Microsoft Excel (.xlsx) format</p>
                </div>
              </button>
            </div>

            {/* Upload Dropzone */}
            <div className="max-w-lg mx-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-gray-50 hover:bg-emerald-50/20 cursor-pointer transition-colors space-y-3"
              >
                <div className="w-12 h-12 bg-white text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border border-gray-200">
                  {parsing ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-800">
                    {parsing ? 'Parsing and validating file...' : 'Click to select CSV or Excel (.xlsx) file'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Supports up to 5,000 businesses per file</p>
                </div>
              </div>

              {parseError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION SUMMARY */}
        {step === 'preview' && validationResult && (
          <div className="p-5 flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Metric Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl">
                <span className="text-[11px] text-gray-500 block">Total Rows</span>
                <span className="text-base font-bold text-gray-900">{validationResult.totalRows.toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                <span className="text-[11px] text-emerald-700 block">New / Valid</span>
                <span className="text-base font-bold text-emerald-800">
                  {validationResult.validRows.length.toLocaleString()}
                </span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl">
                <span className="text-[11px] text-orange-700 block">Exact Duplicates</span>
                <span className="text-base font-bold text-orange-800">
                  {validationResult.exactDuplicateRows.length.toLocaleString()}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                <span className="text-[11px] text-amber-700 block">Possible Duplicates</span>
                <span className="text-base font-bold text-amber-800">
                  {validationResult.possibleDuplicateRows.length.toLocaleString()}
                </span>
              </div>
              <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                <span className="text-[11px] text-red-700 block">Invalid Rows</span>
                <span className="text-base font-bold text-red-800">
                  {validationResult.invalidRows.length.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Actions & Duplicate Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="skipExactDuplicates"
                    checked={skipExactDuplicates}
                    onChange={(e) => setSkipExactDuplicates(e.target.checked)}
                    className="rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="skipExactDuplicates" className="text-gray-700 cursor-pointer font-medium">
                    Skip Exact Duplicates ({validationResult.exactDuplicateRows.length} phone matches)
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="includePossibleDuplicates"
                    checked={includePossibleDuplicates}
                    onChange={(e) => setIncludePossibleDuplicates(e.target.checked)}
                    className="rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="includePossibleDuplicates" className="text-gray-700 cursor-pointer font-medium">
                    Include Possible Duplicates for Review ({validationResult.possibleDuplicateRows.length} rows)
                  </label>
                </div>
              </div>

              {validationResult.invalidRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Error Report ({validationResult.invalidRows.length} issues)</span>
                </button>
              )}
            </div>

            {/* Table Preview */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-16">Row</th>
                    <th className="py-2.5 px-3">Business Name</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Validation Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {validationResult.allRows.slice(0, 100).map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={
                        r.status === 'invalid'
                          ? 'bg-red-50/40'
                          : r.status === 'exact_duplicate'
                          ? 'bg-orange-50/40'
                          : r.status === 'possible_duplicate'
                          ? 'bg-amber-50/40'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="py-2 px-3 text-gray-500 font-mono text-[11px]">{r.rowNumber}</td>
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {r.normalizedData?.businessName || <span className="text-red-500 italic">Empty Name</span>}
                      </td>
                      <td className="py-2 px-3 text-gray-600 font-mono text-[11px]">
                        {r.normalizedData?.mobile || <span className="text-red-500 italic">Missing</span>}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{r.normalizedData?.category || '—'}</td>
                      <td className="py-2 px-3 text-gray-600">{r.normalizedData?.city || '—'}</td>
                      <td className="py-2 px-3">
                        {r.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle2 size={12} /> New Business
                          </span>
                        )}
                        {r.status === 'exact_duplicate' && (
                          <span className="inline-flex items-center gap-1 text-orange-800 font-medium text-[11px]">
                            <AlertTriangle size={12} className="text-orange-600 shrink-0" />
                            Exact Match: {r.duplicateOf?.businessName} ({r.duplicateOf?.mobile})
                          </span>
                        )}
                        {r.status === 'possible_duplicate' && (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-medium text-[11px]">
                            <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                            Possible Match: {r.duplicateOf?.businessName}
                          </span>
                        )}
                        {r.status === 'invalid' && (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium text-[11px]">
                            <XCircle size={12} className="text-red-500 shrink-0" />
                            {r.errors.join(' | ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {validationResult.allRows.length > 100 && (
                <div className="p-2 text-center text-[11px] text-gray-400 bg-gray-50 border-t border-gray-100">
                  Showing first 100 of {validationResult.allRows.length} rows
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('upload')}
                disabled={importing}
                className="px-3.5 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 text-xs flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} /> Back to File Upload
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={
                    importing ||
                    validationResult.validRows.length +
                      (skipExactDuplicates ? 0 : validationResult.exactDuplicateRows.length) +
                      (includePossibleDuplicates ? validationResult.possibleDuplicateRows.length : 0) ===
                      0
                  }
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {importing && <Loader2 size={14} className="animate-spin" />}
                  <span>
                    Import{' '}
                    {validationResult.validRows.length +
                      (skipExactDuplicates ? 0 : validationResult.exactDuplicateRows.length) +
                      (includePossibleDuplicates ? validationResult.possibleDuplicateRows.length : 0)}{' '}
                    Businesses
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Import Completed Successfully</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              <strong>{importedCount.toLocaleString()}</strong> businesses have been saved to the database with{' '}
              <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">UNVERIFIED</span> status.
              Audit history has been logged.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close &amp; View Businesses
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
