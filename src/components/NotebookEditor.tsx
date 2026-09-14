import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Save, 
  Copy, 
  Download, 
  Trash2, 
  Check, 
  ShieldAlert, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface NotebookEditorProps {
  onLock: () => void;
}

const LOCAL_STORAGE_KEY = 'private_notes';

export const NotebookEditor: React.FC<NotebookEditorProps> = ({ onLock }) => {
  const [notes, setNotes] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes on component mount (loadNotes)
  const loadNotes = () => {
    try {
      const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedContent !== null) {
        setNotes(savedContent);
      }
    } catch (e) {
      console.error('Error al cargar las notas de localStorage:', e);
    }
  };

  // Save notes to localStorage (saveNotes)
  const saveNotes = (content: string) => {
    try {
      setIsSaving(true);
      localStorage.setItem(LOCAL_STORAGE_KEY, content);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 300);
    } catch (e) {
      console.error('Error al guardar notas en localStorage:', e);
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadNotes();
    // Focus textarea on load
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    saveNotes(value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas_privadas_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('¿Estás seguro de borrar todo el contenido del bloc de notas privado?')) {
      setNotes('');
      saveNotes('');
    }
  };

  // Statistics
  const charCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const lineCount = notes ? notes.split('\n').length : 0;

  return (
    <div className="min-h-screen bg-[#0d0e11] flex flex-col text-slate-100">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#14161c]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Bloc de Notas Privado
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Desbloqueado
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Clave: <code className="text-blue-300 font-mono">private_notes</code></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {lastSaved 
                  ? `Guardado ${lastSaved.toLocaleTimeString()}`
                  : 'Guardado automático activo'}
              </span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleCopy}
            title="Copiar texto al portapapeles"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700/80 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Descargar notas como archivo .txt"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700/80 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          <button
            type="button"
            onClick={onLock}
            className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Bloquear</span>
          </button>
        </div>
      </header>

      {/* Main Minimalist Editor Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 bg-[#14161d] border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Editor Status Bar Header */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Editor Privado Minimalista
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-slate-400">
                Guardado automático en tiempo real
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="text-blue-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  Guardando...
                </span>
              ) : (
                <span className="text-emerald-400/90 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Sincronizado
                </span>
              )}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={handleChange}
            placeholder="Escribe tus notas privadas aquí... Se guardarán automáticamente cada vez que escribas."
            className="flex-1 w-full bg-transparent p-5 sm:p-7 text-slate-100 placeholder-slate-600 text-base sm:text-lg leading-relaxed resize-none focus:outline-none font-[#111215] tracking-wide"
            style={{ minHeight: 'calc(100vh - 280px)' }}
          />

          {/* Footer Stats Bar */}
          <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span><strong>{charCount}</strong> caracteres</span>
              <span><strong>{wordCount}</strong> palabras</span>
              <span><strong>{lineCount}</strong> líneas</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Borrar nota
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
