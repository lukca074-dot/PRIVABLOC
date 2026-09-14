import React, { useState } from 'react';
import { LobbyScreen } from './components/LobbyScreen';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomScreen } from './components/JoinRoomScreen';
import { VerificationScreen } from './components/VerificationScreen';
import { UnlockAnimation } from './components/UnlockAnimation';
import { RoomChatScreen } from './components/RoomChatScreen';
import { NotebookEditor } from './components/NotebookEditor';
import { AuthStatus, VerificationResponse, Room, AppView } from './types';

export default function App() {
  const [view, setView] = useState<AppView>('lobby');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [userName, setUserName] = useState<string>('Participante');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VerificationResponse | null>(null);

  // Reset verification state
  const resetVerificationState = () => {
    setAuthStatus('idle');
    setErrorMessage(null);
    setLastResult(null);
  };

  // Return to lobby
  const handleGoToLobby = () => {
    setView('lobby');
    setSelectedRoom(null);
    resetVerificationState();
  };

  // Handlers from LobbyScreen
  const handleOpenCreateRoom = () => {
    resetVerificationState();
    setView('create-room');
  };

  const handleOpenJoinRoom = () => {
    resetVerificationState();
    setView('join-room');
  };

  const handleOpenPersonalNotes = () => {
    resetVerificationState();
    setSelectedRoom(null);
    setView('personal-verify');
  };

  // Handler when room is created or joined
  const handleRoomReadyForVerification = (room: Room, userAlias: string) => {
    setSelectedRoom(room);
    setUserName(userAlias);
    resetVerificationState();
    setView('verify-room');
  };

  // Image verification runner
  const verifyImage = async (base64Image: string) => {
    setAuthStatus('analyzing');
    setErrorMessage(null);

    const conditionText = view === 'verify-room' && selectedRoom
      ? selectedRoom.condition
      : undefined;

    try {
      const response = await fetch('/api/verify-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          condition: conditionText,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.reason || 'Error en el servidor al analizar la fotografía.');
      }

      const result: VerificationResponse = await response.json();
      setLastResult(result);

      if (result.approved && typeof result.confidence === 'number' && result.confidence >= 0.90) {
        setAuthStatus('unlocking');
      } else {
        setAuthStatus('rejected');
        setErrorMessage(result.reason || 'La fotografía no cumple con la condición exigida por la IA.');
      }
    } catch (err: any) {
      console.error('Error during image verification:', err);
      setAuthStatus('rejected');
      setErrorMessage(err.message || 'No se pudo conectar con el servidor de análisis. Inténtalo de nuevo.');
    }
  };

  // Unlock completion handler
  const handleUnlockAnimationComplete = () => {
    setAuthStatus('approved');
    if (view === 'verify-room' && selectedRoom) {
      setView('room-chat');
    } else {
      setView('personal-notes');
    }
  };

  // VIEW RENDERING SWITCH
  if (view === 'create-room') {
    return (
      <CreateRoomModal
        onBack={handleGoToLobby}
        onRoomCreated={handleRoomReadyForVerification}
      />
    );
  }

  if (view === 'join-room') {
    return (
      <JoinRoomScreen
        onBack={handleGoToLobby}
        onRoomFound={handleRoomReadyForVerification}
      />
    );
  }

  if (view === 'room-chat' && selectedRoom) {
    return (
      <RoomChatScreen
        room={selectedRoom}
        userName={userName}
        onExitRoom={handleGoToLobby}
      />
    );
  }

  if (view === 'personal-notes') {
    return (
      <NotebookEditor onLock={handleGoToLobby} />
    );
  }

  // Animation phase before unlocking
  if (authStatus === 'unlocking') {
    return (
      <UnlockAnimation
        onAnimationComplete={handleUnlockAnimationComplete}
        reason={lastResult?.reason}
        confidence={lastResult?.confidence}
      />
    );
  }

  // Verification Screen for custom room or personal notes
  if (view === 'verify-room' || view === 'personal-verify') {
    return (
      <VerificationScreen
        status={authStatus}
        errorMessage={errorMessage}
        lastResult={lastResult}
        onImageSelected={verifyImage}
        onRetry={resetVerificationState}
        roomName={selectedRoom ? selectedRoom.name : 'Bloc de Notas Privado'}
        roomCode={selectedRoom ? selectedRoom.code : undefined}
        conditionText={selectedRoom ? selectedRoom.condition : undefined}
        onBack={handleGoToLobby}
      />
    );
  }

  // Default: Main Lobby
  return (
    <LobbyScreen
      onCreateRoomClick={handleOpenCreateRoom}
      onJoinRoomClick={handleOpenJoinRoom}
    />
  );
}
