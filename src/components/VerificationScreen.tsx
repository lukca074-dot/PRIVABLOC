import React, { useState, useRef } from 'react';
import { 
  Lock, 
  Upload, 
  Camera, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Shirt, 
  LockKeyhole,
  X,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthStatus, VerificationResponse } from '../types';

interface VerificationScreenProps {
  status: AuthStatus;
  errorMessage: string | null;
  lastResult: VerificationResponse | null;
  onImageSelected: (base64Image: string) => void;
  onRetry: () => void;
  roomName?: string;
  roomCode?: string;
  conditionText?: string;
  onBack?: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  status,
  errorMessage,
  lastResult,
  onImageSelected,
  onRetry,
  roomName,
  roomCode,
  conditionText,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Default condition text if not in a custom room
  const displayCondition = conditionText || 'Debe aparecer exactamente una persona con una chaqueta, abrigo o cazadora completamente cerrada (cremallera o botones arriba).';

  // Function to process selected or dropped file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Webcam functionality
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setWebcamStream(stream);
      setShowWebcam(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setWebcamError('No se pudo acceder a la cámara. Por favor permite el acceso o sube un archivo.');
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setPreviewImage(dataUrl);
        stopWebcam();
        onImageSelected(dataUrl);
      }
    }
  };

  const isAnalyzing = status === 'analyzing';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0e0f12]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-[#16181e] border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Ambient Glow Header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 blur-sm" />

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-4 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al menú principal
          </button>
        )}

        {/* Lock Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-950/50 border border-blue-500/30 text-blue-400 mb-3 shadow-lg shadow-blue-950/50">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {roomName ? roomName : 'Verificación por Foto IA'}
          </h1>
          {roomCode && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 font-mono text-xs">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Código: {roomCode}
            </div>
          )}
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Acceso protegido. La Inteligencia Artificial verificará tu fotografía antes de permitir la entrada.
          </p>
        </div>

        {/* Status Indicator Banner */}
        <div className="mb-5">
          <div className={`p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
            isAnalyzing 
              ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
              : status === 'rejected'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : status === 'approved' || status === 'unlocking'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              {isAnalyzing ? (
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : status === 'rejected' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : status === 'approved' || status === 'unlocking' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
              
              <div className="text-sm">
                <span className="font-semibold block">Indicador de Estado:</span>
                <span className="opacity-90">
                  {isAnalyzing 
                    ? 'Analizando fotografía...' 
                    : status === 'rejected'
                    ? 'Acceso Denegado'
                    : status === 'approved' || status === 'unlocking'
                    ? 'Fotografía Aprobada'
                    : 'Esperando fotografía de verificación'}
                </span>
              </div>
            </div>

            {lastResult && typeof lastResult.confidence === 'number' && (
              <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300 flex-shrink-0">
                Confianza: {(lastResult.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        {/* Custom Room AI verification info notice */}
        <div className="mb-6 p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs sm:text-sm text-blue-200/90 flex items-start gap-3 shadow-md">
          <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">
              Condición de Entrada Exigida por la IA:
            </p>
            <p className="text-blue-100/90 leading-relaxed font-medium bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              "{displayCondition}"
            </p>
            <p className="text-[11px] text-slate-400">
              La foto debe ser real (sin capturas de pantalla) y cumplir el 100% de esta condición con al menos 90% de confianza.
            </p>
          </div>
        </div>

        {/* Rejection / Error Reason Alert */}
        <AnimatePresence>
          {(status === 'rejected' || errorMessage) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm space-y-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">Motivo de Rechazo de la IA:</p>
                  <p className="text-rose-100/90 leading-relaxed font-normal">
                    {errorMessage || lastResult?.reason || 'La imagen no cumple con las condiciones exigidas.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-900/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    onRetry();
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Intentar con otra fotografía
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Webcam Capture Modal */}
        {showWebcam && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1c23] border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-400" />
                  Tomar fotografía con cámara
                </h3>
                <button 
                  onClick={stopWebcam}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" 
                />
              </div>

              {webcamError && (
                <p className="text-xs text-rose-400">{webcamError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Capturar Foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload / Capture Controls */}
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isAnalyzing}
          />

          {previewImage && status !== 'rejected' && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-64 flex items-center justify-center">
              <img 
                src={previewImage} 
                alt="Vista previa de la fotografía" 
                className="max-h-64 w-full object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center gap-3">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-blue-300 font-medium text-sm tracking-wide animate-pulse">
                    Analizando fotografía...
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Evaluando el requisito de la sala con modelo de visión Gemini IA.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main Upload Drop Zone */}
          {(!previewImage || status === 'rejected') && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-2xl p-8 text-center transition-all bg-slate-900/30 hover:bg-blue-950/10 cursor-pointer group space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Haz clic o arrastra aquí tu fotografía
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos soportados: JPG, PNG, WEBP
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Subir Fotografía
            </button>

            <button
              type="button"
              onClick={startWebcam}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-sm transition border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-blue-400" />
              Usar Cámara Web
            </button>
          </div>
        </div>

        {/* Requirements Footer */}
        <div className="mt-8 pt-5 border-t border-slate-800/60 text-center text-xs text-slate-500">
          <span>Verificación en tiempo real protegida por Gemini 3.6 Flash IA</span>
        </div>
      </motion.div>
    </div>
  );
};

