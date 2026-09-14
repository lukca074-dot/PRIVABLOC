import React, { useState } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  KeyRound, 
  User, 
  Shirt, 
  ArrowLeft, 
  Check, 
  RefreshCw,
  ShieldAlert,
  MessageSquareText
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ensureAuth } from '../lib/firebase';
import { Room } from '../types';

interface CreateRoomModalProps {
  onBack: () => void;
  onRoomCreated: (room: Room, creatorName: string) => void;
}

const CONDITION_PRESETS = [
  {
    id: 'jacket',
    label: '🧥 Chaqueta Cerrada',
    text: 'Debe aparecer exactamente una persona con una chaqueta, abrigo o cazadora completamente cerrada (cremallera o botones arriba).',
  },
  {
    id: 'sunglasses',
    label: '🕶️ Gafas de Sol',
    text: 'Debe aparecer una persona llevando gafas de sol puestas.',
  },
  {
    id: 'coffee',
    label: '☕ Taza de Café',
    text: 'Debe aparecer una persona sosteniendo una taza de café, pocillo o vaso en la mano.',
  },
  {
    id: 'thumbsup',
    label: '👍 Pulgar Arriba y Sonrisa',
    text: 'Debe aparecer una persona sonriendo e haciendo claramente el gesto de pulgar arriba con la mano.',
  },
  {
    id: 'cap',
    label: '🧢 Gorra o Sombrero',
    text: 'Debe aparecer una persona llevando una gorra, sombrero o gorro puesto.',
  },
  {
    id: 'custom',
    label: '✏️ Condición Personalizada',
    text: '',
  },
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onBack,
  onRoomCreated,
}) => {
  const [roomName, setRoomName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('jacket');
  const [customCondition, setCustomCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate random 6-character room code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [roomCode, setRoomCode] = useState(generateCode());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roomName.trim()) {
      setError('Por favor ingresa un nombre para la sala.');
      return;
    }

    if (!roomCode.trim()) {
      setError('Por favor ingresa o genera un código para la sala.');
      return;
    }

    if (!creatorName.trim()) {
      setError('Por favor ingresa tu nombre o alias.');
      return;
    }

    let finalCondition = '';
    if (selectedPreset === 'custom') {
      if (!customCondition.trim() || customCondition.trim().length < 5) {
        setError('Por favor describe tu condición personalizada (mínimo 5 caracteres).');
        return;
      }
      finalCondition = customCondition.trim();
    } else {
      const presetObj = CONDITION_PRESETS.find((p) => p.id === selectedPreset);
      finalCondition = presetObj?.text || CONDITION_PRESETS[0].text;
    }

    setIsSubmitting(true);

    try {
      const user = await ensureAuth();
      const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      const newRoom: Room = {
        id: cleanCode,
        code: cleanCode,
        name: roomName.trim(),
        condition: finalCondition,
        creatorUid: user.uid,
        creatorName: creatorName.trim(),
        createdAt: new Date().toISOString(),
      };

      const path = `rooms/${cleanCode}`;
      try {
        await setDoc(doc(db, 'rooms', cleanCode), newRoom);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }

      onRoomCreated(newRoom, creatorName.trim());
    } catch (err: any) {
      console.error('Error al crear sala:', err);
      setError(err.message || 'No se pudo crear la sala en Firebase. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0c0d10]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-[#15171e] border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al menú principal
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-blue-400" />
            Crear Sala Privada
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configura el nombre de la sala, el código de acceso y el test de foto IA obligatorio.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Room Name & Creator Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de la Sala
              </label>
              <div className="relative">
                <MessageSquareText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ej: Charla Confidencial"
                  maxLength={50}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tu Nombre / Alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Ej: Anfitrión"
                  maxLength={30}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Access Code Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Código de Acceso para la Sala
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="CÓDIGO"
                  maxLength={12}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setRoomCode(generateCode())}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                title="Generar nuevo código aleatorio"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generar</span>
              </button>
            </div>
          </div>

          {/* AI Condition Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Condición de Entrada por Foto (IA)</span>
              <span className="text-[10px] text-blue-400 font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Evaluado por Gemini IA
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {CONDITION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-2.5 rounded-xl text-xs text-left transition border cursor-pointer flex items-center justify-between ${
                    selectedPreset === preset.id
                      ? 'bg-blue-950/80 border-blue-500 text-white font-medium shadow-md shadow-blue-950/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{preset.label}</span>
                  {selectedPreset === preset.id && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {selectedPreset === 'custom' ? (
              <div className="space-y-1">
                <textarea
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="Describe la condición requerida en español. Ej: 'Una persona sosteniendo un libro abierto en la mano' o 'Una persona llevando auriculares'."
                  maxLength={300}
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition placeholder-slate-600 resize-none"
                />
                <p className="text-[11px] text-slate-500">
                  La IA examinará la foto subida por cada participante y verificará si cumple esta descripción.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-blue-200/90 leading-relaxed">
                <strong className="text-white block mb-0.5">Regla activa:</strong>
                {CONDITION_PRESETS.find((p) => p.id === selectedPreset)?.text}
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creando sala en Firebase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Crear Sala y Pasar Test de Foto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
