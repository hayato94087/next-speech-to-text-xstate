import { useCallback } from "react";
import { useMachine } from "@xstate/react";
import { voiceRecognitionMachine } from "../machines/voice-recognition-machine";

export const useVoiceRecognition = () => {
  const [state, send] = useMachine(voiceRecognitionMachine);

  const startRecording = useCallback(() => {
    send({ type: 'START_RECORDING' });
  }, [send]);

  const stopRecording = useCallback(() => {
    send({ type: 'STOP_RECORDING' });
  }, [send]);

  return {
    transcription: state.context.transcription,
    state,
    error: state.context.error,
    startRecording,
    stopRecording,
  };
};