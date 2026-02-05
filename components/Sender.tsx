import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { File as FileIcon, Sparkles, Loader2, Cloud, Trash2, Plus, Share2, Check, Music, AlertCircle } from 'lucide-react';
import { SharedFileMetadata, QRData } from '../types';
import { analyzeFileTransfer } from '../services/gemini';

const Sender: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [aiTip, setAiTip] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ds2mbrzcn/auto/upload";
  const UPLOAD_PRESET = "real_unsigned";

  const isAudio = (fileName: string) => {
    return /\.(mp3|wav|m4a|flac|ogg|aac|wma)$/i.test(fileName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected: File[] = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setError(null);
      setFiles(prev => [...prev, ...selected]);
      
      // AI analysis is secondary and shouldn't block the UI or cause crashes
      try {
        analyzeFileTransfer(
          selected.length > 1 ? `${selected.length} files batch` : selected[0].name,
          selected.reduce((acc, f) => acc + f.size, 0),
          selected[0].type
        ).then(tip => setAiTip(tip || ''));
      } catch (err) {
        console.warn("AI Tip generation skipped:", err);
      }
    }
  };

  const startUpload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setUploadStatus('Syncing with cloud...');
    
    try {
      const uploadedFiles: SharedFileMetadata[] = [];
      for (let i = 0; i < files.length; i++) {
        const currentFile = files[i];
        setUploadStatus(`Beaming: ${currentFile.name}`);
        
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("resource_type", "auto"); // Critical for audio files
        
        const response = await fetch(CLOUDINARY_URL, { 
          method: "POST", 
          body: formData 
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Cloudinary upload failed");
        }
        
        const data = await response.json();
        
        uploadedFiles.push({
          name: currentFile.name,
          size: currentFile.size,
          type: currentFile.type,
          cloudUrl: data.secure_url
        });
        
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadStatus('Generating QR Handshake...');
      const qrData: QRData = {
        version: "1.0",
        files: uploadedFiles,
        timestamp: Date.now()
      };
      setQrPayload(JSON.stringify(qrData));
    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.message || "Beam failed. Try smaller files or check connection.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setQrPayload('');
    setError(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-300 max-w-full">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">Beam</h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">Song & Data Relay.</p>
        </div>
        {files.length > 0 && !qrPayload && (
          <p className="text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {formatSize(files.reduce((acc, f) => acc + f.size, 0))} Total
          </p>
        )}
      </div>

      {!qrPayload ? (
        files.length === 0 ? (
          <label className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-[2.5rem] sm:rounded-[2.5rem] border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition-all duration-300 group">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept="audio/*,image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" 
            />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-6 bg-zinc-800 text-zinc-500 group-hover:text-green-500 transition-colors">
              <Music className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <p className="text-base sm:text-lg font-bold text-white text-center px-4 italic leading-tight">Drop songs or files here</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Any format, any size</p>
          </label>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selected Media</span>
                <label className="text-[10px] font-black text-green-500 uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add More
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple 
                    accept="audio/*,image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" 
                  />
                </label>
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:border-zinc-600 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {isAudio(f.name) ? (
                        <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate italic">{f.name}</p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(f.size)}</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button 
                        type="button"
                        onClick={() => removeFile(i)} 
                        className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex gap-3 items-center animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <p className="text-[11px] text-rose-200 font-bold uppercase italic">{error}</p>
              </div>
            )}

            {aiTip && !isUploading && !error && (
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex gap-3 items-center animate-in slide-in-from-left duration-300">
                <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed">
                  {aiTip}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={startUpload}
                disabled={isUploading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center gap-3 transition-all uppercase italic tracking-wider text-sm disabled:opacity-50 relative overflow-hidden active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="z-10 font-black">Launching Beam: {progress}%</span>
                    <div className="absolute bottom-0 left-0 h-full bg-green-500/30 transition-all duration-300 pointer-events-none" style={{ width: `${progress}%` }} />
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    <span>Initiate Transfer</span>
                  </>
                )}
              </button>
              {isUploading && (
                <p className="text-center text-[9px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">
                  {uploadStatus}
                </p>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 flex flex-col items-center">
          <div className="p-6 sm:p-8 bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-green-500/20">
            <QRCodeSVG value={qrPayload} size={220} level="H" className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]" />
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              <span className="text-sm font-black uppercase italic">Universal Beam Active</span>
            </div>
            <p className="text-zinc-500 text-xs font-medium">Scan this QR on any device to receive media.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setQrPayload('');
              setAiTip('');
              setError(null);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-black py-4 rounded-[1.5rem] sm:rounded-[2rem] uppercase italic tracking-wider text-xs hover:bg-zinc-800 transition-colors"
          >
            Start New Beam
          </button>
        </div>
      )}
    </div>
  );
};

export default Sender;