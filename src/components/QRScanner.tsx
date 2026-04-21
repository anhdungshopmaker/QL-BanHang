'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  // Store onScan in a ref so the useEffect doesn't restart when parent re-renders
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      onScanRef.current(decodedText);
    };

    scannerRef.current.render(onScanSuccess, () => {
      // suppress scan errors
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — scanner mounts once

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
       <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none -rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3"/><path d="M7 12h3"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M12 16v.01"/><path d="M16 16v.01"/><path d="M16 21h.01"/><path d="M12 21h.01"/><path d="M20 7h.01"/><path d="M20 12h.01"/><path d="M7 20h.01"/></svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Quét mã sản phẩm</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Hướng camera về phía mã QR trên sản phẩm</p>
            
            <div id="qr-reader" className="overflow-hidden rounded-3xl border-4 border-indigo-100 bg-slate-50"></div>
            
            <button 
              onClick={onClose}
              className="w-full mt-8 py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95 shadow-xl"
            >
              ĐÓNG MÁY QUÉT
            </button>
          </div>
       </div>
    </div>
  );
}
