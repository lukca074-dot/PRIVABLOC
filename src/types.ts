export interface VerificationResponse {
  approved: boolean;
  confidence: number;
  reason: string;
}

export type AuthStatus = 'idle' | 'analyzing' | 'approved' | 'rejected' | 'unlocking';

export type AppView = 'lobby' | 'create-room' | 'join-room' | 'verify-room' | 'personal-verify' | 'room-chat' | 'personal-notes';

export interface Room {
  id: string; // Document ID (usually same as room code)
  code: string;
  name: string;
  condition: string;
  creatorUid: string;
  creatorName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: string;
  isOneTime?: boolean;
  isRevealed?: boolean;
  revealedByUid?: string;
  revealedByName?: string;
}

export interface NotesData {
  content: string;
  lastSaved: string | null;
}

