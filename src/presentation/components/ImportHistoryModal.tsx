import React from 'react';
import { BusinessImportRecord } from '../../domain/types';
import { X, History, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Calendar, User } from 'lucide-react';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  importHistory: BusinessImportRecord[];
}

export const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  isOpen,
  onClose,
  importHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History size={20} className="text-emerald-400" />
            <div>
              <h2 className="font-bold text-base leading-tight">Batch Import Audit History</h2>
              <p className="text-[11px] text-slate-400">Ledger of past bulk spreadsheet ingestions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of imports */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {importHistory.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              <FileSpreadsheet size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No bulk imports recorded yet.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                When an administrator uploads a CSV or Excel list, the batch audit log will appear here.
              </p>
            </div>
          ) : (
            importHistory.map((rec) => (
              <div
                key={rec.importId}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2.5 text-xs shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-[10px]">
                      {rec.fileType.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{rec.fileName}</h4>
                      <p className="text-[11px] text-gray-500 font-mono">
                        Batch ID: <strong>{rec.importId}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rec.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-400 block">Total Rows:</span>
                    <strong className="text-gray-900">{rec.totalRows}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-600 block">Imported:</span>
                    <strong className="text-emerald-800">{rec.importedRows}</strong>
                  </div>
                  <div>
                    <span className="text-amber-600 block">Duplicates:</span>
                    <strong className="text-amber-800">{rec.duplicateRows}</strong>
                  </div>
                  <div>
                    <span className="text-red-500 block">Invalid/Errors:</span>
                    <strong className="text-red-700">{rec.invalidRows}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-gray-400" />
                    <span>Uploaded by: {rec.uploadedByName || rec.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{new Date(rec.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
