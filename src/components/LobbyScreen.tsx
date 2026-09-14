import React, { useState } from 'react';
import { 
  Lock, 
  PlusCircle, 
  LogIn, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  MessageSquareText, 
  Users, 
  ArrowRight,
  Shirt
} from 'lucide-react';
import { motion } from 'motion/react';

interface LobbyScreenProps {
  onCreateRoomClick: () => void;
  onJoinRoomClick: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onCreateRoomClick,
  onJoinRoomClick,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0c0d10]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-[#15171e] border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden"
      >
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80 blur-sm" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-blue-400 mb-4 shadow-xl shadow-blue-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Salas Privadas y Chats Protegidos por IA
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto leading-relaxed">
            Crea una sala de chat privada con tu propia regla de foto por IA o únete introduciendo un código.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          {/* Create Room Option */}
          <motion.div
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateRoomClick}
            className="p-5 rounded-2xl bg-gradient-to-b from-blue-950/40 to-slate-900/60 border border-blue-800/40 hover:border-blue-500/60 cursor-pointer transition-all shadow-lg group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
                Creador
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
              Crear Nueva Sala
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define tu propio requisito de verificación por foto IA (chaqueta, gafas, objeto, etc.) y genera un código.
            </p>
          </motion.div>

          {/* Join Room Option */}
          <motion.div
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onJoinRoomClick}
            className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-lg group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700 group-hover:bg-blue-950 group-hover:text-blue-400 transition-colors">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Invitado
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
              Ingresar con Código
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Introduce el código de la sala, pasa el test de foto por IA exigido por el creador y accede al chat.
            </p>
          </motion.div>
        </div>

        {/* Footer info badge */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Protegido en tiempo real con Gemini 3.6 Flash & Firebase Cloud</span>
        </div>
      </motion.div>
    </div>
  );
};
