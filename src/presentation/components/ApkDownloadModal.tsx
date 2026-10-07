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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-gray-800 text-xs">
          {/* PRIMARY OPTION: Native Android WebAPK Installation */}
          <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/90 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <Smartphone size={20} className="text-emerald-700" />
                <span>Full Native App Installation</span>
              </div>
              <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                No Computer Needed
              </span>
            </div>
            
            <p className="text-gray-700 text-xs leading-relaxed">
              Google Play Services on your Android phone automatically packages and installs <strong>Sampark as a full native app</strong> directly to your home screen and app drawer.
            </p>

            {/* Native App Features List */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900 bg-white/80 p-3 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Full screen (no URL bar)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Home screen launcher icon</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Camera &amp; gallery access</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Instant cloud sync</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onInstallPwa();
              }}
              className="w-full min-h-[46px] py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
            >
              <Zap size={18} />
              <span>Install Full Native App on This Phone</span>
            </button>

            <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-950 text-xs space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <span>📱 2 Simple Steps on Your Phone:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900 pl-1">
                <li>Tap the green button above, then tap <strong>&quot;Install&quot;</strong> on the prompt.</li>
                <li>If the prompt doesn&apos;t pop up, tap Chrome&apos;s <strong>3 vertical dots (⋮)</strong> at the top right of your phone &rarr; select <strong>&quot;Install app&quot;</strong>.</li>
              </ol>
            </div>
          </div>

          {/* SECONDARY OPTION: Source Code for Developers */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                <FileCode size={15} className="text-slate-700" />
                <span>Jetpack Compose Kotlin Codebase</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                For Developers (92 KB)
              </span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              Complete native Kotlin &amp; Jetpack Compose source project for developers who want to compile in Android Studio.
            </p>
            <a
              href="/sampark-android-v1-production.zip"
              download="sampark-android-v1-production.zip"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Download size={14} />
              <span>Download Kotlin Source Project (.zip)</span>
            </a>
          </div>

          {/* Guarantee / Security info */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>Google Play Services verified · Safe native Android deployment.</span>
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
