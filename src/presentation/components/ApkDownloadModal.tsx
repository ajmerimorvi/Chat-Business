import React, { useState } from 'react';
import { Smartphone, Download, ExternalLink, Zap, CheckCircle2, ShieldCheck, X, FileCode, Loader2 } from 'lucide-react';
import { downloadSamparkApk } from '../../utils/apkDownloader';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa: () => void;
  isInstallable: boolean;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  isInstallable,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTriggerApkDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadSamparkApk();
      setDownloadSuccess(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-inner font-bold text-lg">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Download Sampark APK</h3>
                <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded">
                  v1.0.0 Ready
                </span>
              </div>
              <p className="text-xs text-emerald-200">Official Android Package (.apk)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm font-semibold"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-gray-800 text-xs">
          {/* PRIMARY OPTION: Direct Download Sampark.apk */}
          <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <Download size={18} className="text-emerald-700" />
                <span>Download Standalone APK</span>
              </div>
              <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                1-Tap File Download
              </span>
            </div>
            <p className="text-gray-700 text-xs leading-relaxed">
              Downloads the official signed <strong className="text-gray-950 font-semibold">Sampark.apk</strong> directly into your Android phone's Downloads folder.
            </p>

            <button
              onClick={handleTriggerApkDownload}
              disabled={downloading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-center disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Preparing Download...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download Sampark.apk (13 KB)</span>
                </>
              )}
            </button>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">File download started!</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Pull down your notification bar or check your phone's <strong>Downloads</strong> folder, tap <strong>Sampark.apk</strong>, and select <strong>Install</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-emerald-100/70 text-emerald-900 text-[11px] leading-relaxed">
              💡 <strong>Installation Tip:</strong> Once downloaded, tap the notification to open and install. If prompted with "Install unknown apps", tap <strong>Settings</strong> and allow Chrome once.
            </div>

            <div className="pt-1 text-center">
              <a
                href="/Sampark-apk.zip"
                download="Sampark-apk.zip"
                className="text-emerald-800 hover:text-emerald-950 underline font-semibold inline-flex items-center gap-1 text-[11px]"
              >
                <span>📦 Direct ZIP download: Sampark-apk.zip (7.5 KB)</span>
              </a>
            </div>
          </div>

          {/* SECONDARY OPTION: Install via Browser */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                <Smartphone size={15} className="text-teal-700" />
                <span>Alternative: Add to Phone via Chrome</span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded">
                Browser PWA
              </span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Adds the app icon directly to your home screen without saving an APK file.
            </p>
            <button
              onClick={() => {
                onClose();
                onInstallPwa();
              }}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Smartphone size={14} />
              <span>Add to Home Screen</span>
            </button>
          </div>

          {/* TERTIARY OPTION: Download Source Code */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                <FileCode size={15} className="text-slate-700" />
                <span>Sampark V1 Production Codebase (.zip)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                V1 Production (92 KB)
              </span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Complete native Jetpack Compose &amp; Gradle Android project codebase with Gradle wrapper JAR, FCM push service, firestore.rules, and decoupled 4-tier verification.
            </p>
            <a
              href="/sampark-android-v1-production.zip"
              download="sampark-android-v1-production.zip"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Download size={14} />
              <span>Download V1 Production Project ZIP (92 KB)</span>
            </a>
          </div>

          {/* Guarantee / Security info */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>Safe &amp; signed with Android v1/v2/v3 signatures.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
