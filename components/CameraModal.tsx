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
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScreenFlashOn, setIsScreenFlashOn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsTorchOn(false);
  };

  const startCamera = async () => {
    try {
      setError(null);
      // Demande la résolution maximale possible (4K idealement)
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Vérifier si le flash (torch) est disponible
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Cast as any because TS sometimes misses 'torch' in capabilities
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

    } catch (err) {
      console.log("Camera error", err);
      setError("Impossible d'accéder à la caméra haute définition. Essayez l'import.");
    }
  };

  const toggleTorch = async () => {
    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn }] as any
        });
        setIsTorchOn(!isTorchOn);
      } catch (e) {
        console.error("Torch error", e);
      }
    } else {
      // Fallback: Screen Flash
      setIsScreenFlashOn(!isScreenFlashOn);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0) return;

      // Capture en résolution native de la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compression légère JPEG 0.9 pour garder les détails du texte
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Container Full Screen */}
      <div className="relative w-full h-full flex flex-col bg-black">
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="font-serif text-white text-lg drop-shadow-md">Scanner une étiquette</h3>
            <button onClick={onClose} className="text-white p-2 rounded-full bg-black/20 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Main Viewport */}
        <div className="relative flex-grow flex items-center justify-center overflow-hidden bg-stone-900">
            {error ? (
                <div className="text-stone-400 p-8 text-center max-w-xs">
                    <p className="mb-4">{error}</p>
                    <button onClick={() => fileInputRef.current?.click()} className="text-white underline">
                        Utiliser la galerie
                    </button>
                </div>
            ) : (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            
            {/* Screen Flash Overlay */}
            {isScreenFlashOn && (
                <div className="absolute inset-0 bg-white opacity-90 pointer-events-none mix-blend-overlay z-10"></div>
            )}

            {/* Target Guides */}
            {!error && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    <div className="w-[70%] h-[50%] border-2 border-white/50 rounded-xl relative box-shadow-camera">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-wine-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-wine-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-wine-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-wine-500 -mb-1 -mr-1"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <p className="text-white/70 text-xs font-bold uppercase tracking-widest bg-black/30 px-2 py-1 rounded">Aligner l'étiquette</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className="bg-black/80 backdrop-blur-md pb-8 pt-6 px-8 flex justify-between items-center z-20">
            
            {/* Gallery Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
            >
                <div className="p-3 rounded-full bg-stone-800 border border-stone-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12.25c0 1.243.957 2.25 2.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <span className="text-[10px] font-bold uppercase">Import</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* Shutter Button */}
            <button 
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
            >
                <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>

            {/* Torch/Flash Button */}
            <button 
                onClick={toggleTorch}
                className={`flex flex-col items-center gap-1 transition-colors ${isTorchOn || isScreenFlashOn ? 'text-yellow-400' : 'text-white/80 hover:text-white'}`}
            >
                <div className={`p-3 rounded-full border border-stone-600 ${isTorchOn || isScreenFlashOn ? 'bg-yellow-400/20 border-yellow-400' : 'bg-stone-800'}`}>
                    {isTorchOn || isScreenFlashOn ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    )}
                </div>
                <span className="text-[10px] font-bold uppercase">{isTorchOn ? 'On' : 'Off'}</span>
            </button>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraModal;