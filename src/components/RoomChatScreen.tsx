import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Lock, 
  Copy, 
  Check, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  LogOut, 
  MessageSquare, 
  FileText, 
  Save,
  Clock,
  Eye,
  EyeOff,
  Flame,
  Zap,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ensureAuth } from '../lib/firebase';
import { Room, ChatMessage } from '../types';

interface RoomChatScreenProps {
  room: Room;
  userName: string;
  onExitRoom: () => void;
}

export const RoomChatScreen: React.FC<RoomChatScreenProps> = ({
  room,
  userName,
  onExitRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isOneMode, setIsOneMode] = useState(false);
  const [revealedMsgIds, setRevealedMsgIds] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [roomNotes, setRoomNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedTime, setNotesSavedTime] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authenticate & setup listeners
  useEffect(() => {
    let unsubscribeMessages: (() => void) | undefined;
    let unsubscribeRoom: (() => void) | undefined;

    const init = async () => {
      try {
        const user = await ensureAuth();
        setCurrentUserId(user.uid);

        // Listen to messages subcollection
        const messagesRef = collection(db, 'rooms', room.id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        unsubscribeMessages = onSnapshot(
          q,
          (snapshot) => {
            const list: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                roomId: data.roomId || room.id,
                senderUid: data.senderUid,
                senderName: data.senderName,
                text: data.text,
                createdAt: data.createdAt,
                isOneTime: !!data.isOneTime,
              });
            });
            setMessages(list);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, `rooms/${room.id}/messages`);
          }
        );

        // Listen to room document for shared notes
        const roomDocRef = doc(db, 'rooms', room.id);
        unsubscribeRoom = onSnapshot(
          roomDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.notes !== undefined) {
                setRoomNotes(data.notes || '');
              }
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `rooms/${room.id}`);
          }
        );

      } catch (err) {
        console.error('Error in room initialization:', err);
      }
    };

    init();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeRoom) unsubscribeRoom();
    };
  }, [room.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const textToSend = newMessageText.trim();
    const sendAsOne = isOneMode;
    setNewMessageText('');

    try {
      const user = await ensureAuth();
      const messagesRef = collection(db, 'rooms', room.id, 'messages');

      const msgData: Record<string, any> = {
        roomId: room.id,
        senderUid: user.uid,
        senderName: userName || 'Anónimo',
        text: textToSend,
        createdAt: new Date().toISOString(),
        isOneTime: sendAsOne,
      };

      try {
        await addDoc(messagesRef, msgData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.id}/messages`);
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
    }
  };

  // Handle revealing and deleting a ONE message
  const handleRevealMessage = (msgId: string) => {
    setRevealedMsgIds((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleDestroyMessage = async (msgId: string) => {
    try {
      const msgRef = doc(db, 'rooms', room.id, 'messages', msgId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.error('Error al autodestruir mensaje:', err);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const roomDocRef = doc(db, 'rooms', room.id);
      const updateData = {
        notes: roomNotes,
        notesLastUpdated: new Date().toISOString(),
      };
      try {
        await updateDoc(roomDocRef, updateData);
        setNotesSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `rooms/${room.id}`);
      }
    } catch (err) {
      console.error('Error al guardar notas:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-slate-100 flex flex-col">
      {/* Top Navigation Header */}
      <header className="bg-[#14161d] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Room Title & Code Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {room.name}
                </h1>
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-blue-300 hover:border-blue-500 transition cursor-pointer"
                  title="Copiar código de sala"
                >
                  <span>{room.code}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Condición IA: "{room.condition}"</span>
              </p>
            </div>
          </div>

          {/* Center Tabs: Chat vs Shared Notes */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat en Vivo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bloc Compartido</span>
            </button>
          </div>

          {/* User Alias & Exit button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase text-slate-500 block font-semibold">Participante</span>
              <span className="text-xs text-slate-200 font-medium">{userName}</span>
            </div>
            <button
              type="button"
              onClick={onExitRoom}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 hover:border-rose-800 text-slate-300 hover:text-rose-200 border border-slate-800 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear y Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col min-h-0">
        {activeTab === 'chat' ? (
          /* CHAT TAB */
          <div className="flex-1 bg-[#14161d] border border-slate-800/80 rounded-2xl p-4 flex flex-col shadow-xl min-h-[500px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar max-h-[calc(100vh-250px)] min-h-[350px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                  <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-400">
                    No hay mensajes en esta sala aún.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    ¡Escribe un mensaje normal o activa el modo <strong>ONE (Lectura Única)</strong> para mensajes efímeros!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderUid === currentUserId;
                  const timeFormatted = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  // ONE / Single-View Message Handling
                  if (msg.isOneTime) {
                    const isRevealed = revealedMsgIds[msg.id];

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-amber-400 font-medium px-1">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chat ONE (Lectura Única) • {isMe ? 'Tú' : msg.senderName}</span>
                          {timeFormatted && (
                            <span className="text-slate-600 font-mono">• {timeFormatted}</span>
                          )}
                        </div>

                        {isMe ? (
                          /* SENDER VIEW OF ONE MESSAGE */
                          <div className="max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-100 shadow-md">
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-800/40 text-xs font-semibold text-amber-300">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                Mensaje ONE Enviado
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDestroyMessage(msg.id)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                Destruir ya
                              </button>
                            </div>
                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                            <p className="text-[10px] text-amber-400/80 mt-2 font-mono flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              Se autodestruirá de la base de datos cuando la otra persona lo abra.
                            </p>
                          </div>
                        ) : !isRevealed ? (
                          /* RECIPIENT VIEW BEFORE REVEAL */
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/40 border border-amber-500/50 text-slate-100 shadow-xl cursor-pointer"
                            onClick={() => handleRevealMessage(msg.id)}
                          >
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-400">
                              <Lock className="w-4 h-4 text-amber-400" />
                              <span>MENSAJE CONFIDENCIAL ONE</span>
                            </div>
                            <p className="text-xs text-slate-300 mb-3">
                              Este mensaje solo se puede ver <strong>UNA VEZ</strong>. Se eliminará al leerlo.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRevealMessage(msg.id)}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Tocar para Revelar y Leer</span>
                            </button>
                          </motion.div>
                        ) : (
                          /* RECIPIENT VIEW AFTER REVEAL */
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl bg-rose-950/40 border border-rose-500/80 text-rose-100 shadow-2xl relative"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-rose-800/60 text-xs font-bold text-rose-300">
                              <span className="flex items-center gap-1">
                                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                                Mensaje Revelado (1 sola lectura)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDestroyMessage(msg.id)}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shadow"
                              >
                                <Trash2 className="w-3 h-3" />
                                Cerrar y Eliminar
                              </button>
                            </div>
                            <p className="text-sm font-medium leading-relaxed break-words text-white py-1">{msg.text}</p>
                            <div className="mt-3 pt-2 border-t border-rose-900/40 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-rose-300/80">
                                ⚠️ Elimina este mensaje antes de salir.
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDestroyMessage(msg.id)}
                                className="text-xs text-rose-300 hover:text-white font-bold underline cursor-pointer"
                              >
                                Entendido, eliminar
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  }

                  /* STANDARD CHAT MESSAGE */
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-300">{isMe ? 'Tú' : msg.senderName}</span>
                        {timeFormatted && (
                          <span className="text-slate-600 font-mono">• {timeFormatted}</span>
                        )}
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Mode Selector & Input Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
              {/* Mode Switcher */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsOneMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      !isOneMode
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Normal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOneMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isOneMode
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-amber-400/80 hover:text-amber-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chat ONE (1 Lectura)</span>
                  </button>
                </div>

                {isOneMode && (
                  <span className="text-[11px] text-amber-400 font-medium hidden sm:flex items-center gap-1 animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Mensaje efímero de lectura única
                  </span>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={
                    isOneMode
                      ? "Escribe un mensaje de lectura única ONE (se eliminará tras leerse)..."
                      : "Escribe un mensaje privado..."
                  }
                  maxLength={1000}
                  className={`flex-1 border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition placeholder-slate-500 ${
                    isOneMode
                      ? 'bg-amber-950/20 border-amber-600/50 focus:border-amber-400 text-amber-100'
                      : 'bg-slate-900 border-slate-800 focus:border-blue-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className={`px-5 py-3 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg ${
                    isOneMode
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-amber-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  }`}
                >
                  <span>{isOneMode ? 'Enviar ONE' : 'Enviar'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* SHARED NOTEBOOK TAB */
          <div className="flex-1 bg-[#14161d] border border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-xl min-h-[500px]">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Bloc de Notas Compartido de la Sala</h2>
              </div>
              <div className="flex items-center gap-3">
                {notesSavedTime && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    Guardado a las {notesSavedTime}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSavingNotes ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Notas</span>
                </button>
              </div>
            </div>

            <textarea
              value={roomNotes}
              onChange={(e) => setRoomNotes(e.target.value)}
              placeholder="Escribe aquí notas, secretos o listas compartidas para todos los miembros verificados de esta sala..."
              className="flex-1 w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-slate-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-blue-500 transition resize-none custom-scrollbar min-h-[350px]"
            />
          </div>
        )}
      </main>
    </div>
  );
};
