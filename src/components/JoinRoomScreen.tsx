import React, { useState } from 'react';
import { 
  LogIn, 
  KeyRound, 
  User, 
  ArrowLeft, 
  ShieldAlert, 
  Sparkles,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ensureAuth } from '../lib/firebase';
import { Room } from '../types';

interface JoinRoomScreenProps {
  onBack: () => void;
  onRoomFound: (room: Room, userName: string) => void;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  onBack,
  onRoomFound,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanCode) {
      setError('Por favor ingresa un código de sala válido.');
      return;
    }

    if (!userName.trim()) {
      setError('Por favor ingresa tu nombre o alias.');
      return;
    }

    setIsSearching(true);

    try {
      await ensureAuth();
      const roomRef = doc(db, 'rooms', cleanCode);
      let roomSnap;
      
      try {
        roomSnap = await getDoc(roomRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `rooms/${cleanCode}`);
      }

      if (roomSnap && roomSnap.exists()) {
        const roomData = roomSnap.data() as Room;
        onRoomFound(roomData, userName.trim());
      } else {
        setError(`No se encontró ninguna sala con el código "${cleanCode}". Verifica el código con la persona que creó la sala.`);
      }
    } catch (err: any) {
      console.error('Error al buscar sala:', err);
      setError(err.message || 'Error de conexión con Firebase al buscar la sala.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0c0d10]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#15171e] border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 relative"
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
          <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Unirse a una Sala
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Ingresa el código proporcionado por el creador para consultar la condición de acceso por foto IA.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Código de la Sala
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Ej: VIP888"
                maxLength={12}
                className="w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-base font-mono tracking-widest uppercase focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tu Nombre o Alias
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ej: Laura"
                maxLength={30}
                className="w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Buscando sala...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buscar Sala y Ver Condición IA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
