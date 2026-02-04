import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { File as FileIcon, Sparkles, Loader2, Cloud, Trash2, Plus, Share2, Check } from 'lucide-react';
import { SharedFileMetadata, QRData } from '../types';
import { analyzeFileTransfer } from '../services/gemini';

const Sender: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [aiTip, setAiTip] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ds2mbrzcn/auto/upload";
  const UPLOAD_PRESET = "real_unsigned";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected: File[] = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected]);
      const tip = await analyzeFileTransfer(
        selected.length > 1 ? `${selected.length} files batch` : selected[0].name,
        selected.reduce((acc, f) => acc + f.size, 0),
        selected[0].type
      );
      setAiTip(tip || '');
    }
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setProgress(0);
    try {
      const uploadedFiles: SharedFileMetadata[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("upload_preset", UPLOAD_PRESET);
        
        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        if (!response.ok) throw new Error("Cloudinary upload failed");
        const data = await response.json();
        
        uploadedFiles.push({
          name: files[i].name,
          size: files[i].size,
          type: files[i].type,
          cloudUrl: data.secure_url
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const qrData: QRData = {
        version: "1.0",
        files: uploadedFiles,
        timestamp: Date.now()
      };
      setQrPayload(JSON.stringify(qrData));
    } catch (err) {
      console.error(err);
      alert("Beam failed. Check your connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setQrPayload('');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white italic uppercase">Beam</h2>
          <p className="text-zinc-500 text-sm font-medium">Cloud-powered instant relay.</p>
        </div>
        {files.length > 0 && !qrPayload && (
          <p className="text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
          </p>
        )}
      </div>

      {!qrPayload ? (
        files.length === 0 ? (
          <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition-all duration-300">
            <input type="file" onChange={handleFileChange} className="hidden" multiple />
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-zinc-800 text-zinc-500">
              <Cloud className="w-10 h-10" />
            </div>
            <p className="text-lg font-bold text-white text-center px-4 italic">Load local files</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Any format supported</p>
          </label>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Batch</span>
                <label className="text-[10px] font-black text-green-500 uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add More
                  <input type="file" onChange={handleFileChange} className="hidden" multiple />
                </label>
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate italic">{f.name}</p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(f.size)}</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button onClick={() => removeFile(i)} className="p-1.5 text-zinc-600 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {aiTip && !isUploading && (
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex gap-3 items-center">
                <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed">
                  {aiTip}
                </p>
              </div>
            )}

            <button
              onClick={startUpload}
              disabled={isUploading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all uppercase italic tracking-wider text-sm disabled:opacity-50 relative overflow-hidden"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Beaming {progress}%</span>
                  <div className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span>Launch Beam</span>
                </>
              )}
            </button>
          </div>
        )
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 flex flex-col items-center">
          <div className="p-8 bg-white rounded-[3rem] shadow-2xl shadow-green-500/20">
            <QRCodeSVG value={qrPayload} size={220} level="M" />
          </div>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              <span className="text-sm font-black uppercase italic">Beam Ready</span>
            </div>
            <p className="text-zinc-500 text-xs font-medium">Scan this QR on the receiver device.</p>
          </div>

          <button
            onClick={() => {
              setFiles([]);
              setQrPayload('');
              setAiTip('');
            }}
            className="w-full bg-zinc-900 border border-zinc-800 text-white font-black py-4 rounded-[2rem] uppercase italic tracking-wider text-xs hover:bg-zinc-800 transition-colors"
          >
            New Beam
          </button>
        </div>
      )}
    </div>
  );
};

export default Sender;