
import React, { useRef, useEffect, useState } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setError(null);
        } catch (err) {
          console.log("Camera error or PC without webcam", err);
          // On n'affiche pas forcément d'erreur critique car l'utilisateur peut vouloir upload seulement
          setError("Caméra non détectée. Utilisez l'import de photo.");
        }
      };
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageBase64);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-stone-800 text-white z-10">
            <h3 className="font-serif text-lg">Scanner ou Importer</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Viewport */}
        <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
            {error ? (
                <div className="flex flex-col items-center text-stone-500 p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-1.342 48.63 48.63 0 013.486 0c.459.02.907.127 1.312.314 1.69.78 3.54 1.05 5.373.813 1.078-.14 2.126-.409 3.125-.793M3.75 4.875a6.001 6.001 0 00-3.75 0V17.25a3 3 0 003 3h16.5a3 3 0 003-3v-7.875" />
                    </svg>
                    <p>{error}</p>
                </div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            
            {/* Guide overlay */}
            {!error && (
                <div className="absolute inset-8 border-2 border-white/30 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                </div>
            )}
        </div>

        {/* Controls Footer */}
        <div className="p-6 bg-stone-800 flex justify-between items-center px-8 md:px-12">
            
            {/* Gallery Import Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-stone-400 hover:text-white transition-colors"
                title="Importer une photo"
            >
                <div className="p-3 rounded-full bg-stone-700/50 border border-stone-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12.25c0 1.243.957 2.25 2.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Galerie</span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />

            {/* Camera Shutter Button */}
            <button 
                onClick={handleCapture}
                disabled={!!error}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${error ? 'border-stone-600 bg-stone-700 opacity-50 cursor-not-allowed' : 'bg-white border-stone-300 hover:bg-stone-100 active:scale-95'}`}
            >
                <div className={`w-14 h-14 rounded-full ${error ? 'bg-stone-600' : 'bg-wine-700 border-2 border-white'}`}></div>
            </button>
            
            {/* Spacer for centering */}
            <div className="w-12"></div>
        </div>
        
        {/* Hidden canvas for capture processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraModal;
