import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  CheckCircle, 
  Download, 
  AlertCircle, 
  File as FileIcon, 
  Cloud, 
  Upload, 
  RefreshCw, 
  ChevronLeft,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { QRData, SharedFileMetadata } from '../types';

type ReceiverStep = 'MENU' | 'SCANNING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

const Receiver: React.FC = () => {
  const [step, setStep] = useState<ReceiverStep>('MENU');
  const [errorMessage, setErrorMessage] = useState('');
  const [receivedFiles, setReceivedFiles] = useState<SharedFileMetadata[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanner = async (mode: 'user' | 'environment') => {
    setStep('SCANNING');
    setIsScanning(true);
    
    // Slight delay to ensure DOM element is ready
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader-target", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: mode },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {}
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        setErrorMessage("Could not access camera. Please check permissions.");
        setStep('ERROR');
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Scanner stop error:", e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    await stopScanner();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startScanner(newMode);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('PROCESSING');
    
    try {
      // Use the hidden target that is always present in the DOM
      const scanner = new Html5Qrcode("qr-reader-target-hidden", false);
      const decodedText = await scanner.scanFile(file, true);
      onScanSuccess(decodedText);
      
      // Attempt to clear if instance was successful
      try { scanner.clear(); } catch(e) {}
    } catch (err) {
      console.error("QR decoding failed", err);
      setErrorMessage("No valid QR code detected in this image. Please try a clearer photo.");
      setStep('ERROR');
    } finally {
      // Reset input value so same file can be selected again if needed
      if (e.target) e.target.value = '';
    }
  };

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      stopScanner();
      
      setReceivedFiles(data.files);
      setStep('PROCESSING');

      // Automatically trigger downloads
      data.files.forEach((file, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          const downloadUrl = file.cloudUrl.includes('/upload/') 
            ? file.cloudUrl.replace('/upload/', '/upload/fl_attachment/') 
            : file.cloudUrl;
          
          link.href = downloadUrl;
          link.download = file.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          if (index === data.files.length - 1) {
            setStep('COMPLETE');
          }
        }, index * 800);
      });
    } catch (e) {
      console.error("Invalid QR Payload", e);
      setErrorMessage("The QR code scanned is not a valid Q-Beam payload.");
      setStep('ERROR');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tight">Intercept</h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">Capture incoming beams.</p>
        </div>
        {step !== 'MENU' && step !== 'COMPLETE' && (
          <button 
            onClick={() => {
              stopScanner();
              setStep('MENU');
            }}
            className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu Step */}
      {step === 'MENU' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => startScanner(facingMode)}
            className="flex flex-col items-center justify-center p-8 bg-white text-black rounded-[2.5rem] hover:scale-[1.02] transition-all group"
          >
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-4 text-white group-hover:bg-green-500 transition-colors">
              <Camera className="w-7 h-7" />
            </div>
            <span className="font-black uppercase italic text-sm tracking-widest">Live Scan</span>
            <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">Camera Relay</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 text-white rounded-[2.5rem] hover:scale-[1.02] transition-all group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 group-hover:text-green-500 transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <span className="font-black uppercase italic text-sm tracking-widest">Upload QR</span>
            <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">Gallery / Files</span>
          </button>
        </div>
      )}

      {/* Scanning Step */}
      {step === 'SCANNING' && (
        <div className="space-y-4 animate-in zoom-in-95">
          <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-zinc-900 bg-black aspect-square max-w-[400px] mx-auto">
            <div id="qr-reader-target" className="w-full h-full" />
            
            <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <div className="bg-black/80 backdrop-blur px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Search</span>
              </div>
            </div>

            <button 
              onClick={switchCamera}
              className="absolute bottom-6 right-6 p-4 bg-white text-black rounded-2xl shadow-xl hover:bg-green-500 hover:text-white transition-all pointer-events-auto"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Align QR within the frame</p>
        </div>
      )}

      {/* Processing Step */}
      {step === 'PROCESSING' && (
        <div className="glass p-12 rounded-[3rem] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 border-zinc-800">
          <div className="w-20 h-20 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-white italic uppercase">Pulling Data</h3>
          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Auto-downloading beam...</p>
        </div>
      )}

      {/* Complete Step */}
      {step === 'COMPLETE' && (
        <div className="glass p-8 rounded-[3rem] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 border-green-500/30">
          <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="w-full space-y-4">
            <h3 className="text-2xl font-bold text-white italic uppercase tracking-tight">Beam Captured</h3>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Downloaded to your local device</p>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {receivedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-left hover:border-zinc-600 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                    <FileIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white italic truncate">{file.name}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(file.size)}</p>
                  </div>
                  <a
                    href={file.cloudUrl.includes('/upload/') ? file.cloudUrl.replace('/upload/', '/upload/fl_attachment/') : file.cloudUrl}
                    target="_blank"
                    className="p-3 bg-white text-black rounded-xl hover:bg-green-500 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => {
              setReceivedFiles([]);
              setStep('MENU');
            }}
            className="text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            Intercept Another
          </button>
        </div>
      )}

      {/* Error Step */}
      {step === 'ERROR' && (
        <div className="p-12 glass rounded-[3rem] flex flex-col items-center text-center space-y-6 border-rose-500/30">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <h3 className="text-2xl font-black text-white italic uppercase">Beam Error</h3>
          <p className="text-zinc-500 text-sm font-medium px-4">{errorMessage}</p>
          <button onClick={() => setStep('MENU')} className="w-full bg-white text-black font-black py-4 rounded-[2rem] uppercase italic">Back to Menu</button>
        </div>
      )}

      {/* Persistent hidden container for scanFile calls */}
      <div 
        id="qr-reader-target-hidden" 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', visibility: 'hidden' }} 
      />
    </div>
  );
};

export default Receiver;