import { fromPromise, setup } from 'xstate';
import { transcribeAudio } from "@/app/actions";

/* eslint-plugin-xstate-include */

export const voiceRecognitionMachine = setup({
  types: {} as {
    context: {
      transcription: string;
      error: string | null;
      stream: MediaStream | null;
      mediaRecorder: MediaRecorder | null;
    };
    events:
      | { type: 'START_RECORDING' }
      | { type: 'STOP_RECORDING' }
      | { type: 'TRANSCRIPTION_COMPLETE'; transcription: string }
      | { type: 'TRANSCRIPTION_ERROR'; error: string };
  },
  actions: {
    stopRecording: ({ context }) => {
      if (context.mediaRecorder && context.stream) {
        context.mediaRecorder.stop();
        context.stream.getTracks().forEach((track) => track.stop());
      }
    },
  },
  actors: {
    getUserMedia: fromPromise(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      return { stream, mediaRecorder };
    }),
    transcribeAudio: fromPromise( async ({ input }: { input: { mediaRecorder: MediaRecorder | null } }) => {
      const audioChunks = await new Promise<Blob[]>((resolve) => {
        const chunks: Blob[] = [];
        input.mediaRecorder!.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        input.mediaRecorder!.onstop = () => resolve(chunks);
      });
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      return transcribeAudio(formData);
    }),
  },
}).createMachine({
  id: 'voiceRecognition',
  context: {
    transcription: '',
    error: null,
    stream: null,
    mediaRecorder: null,
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        START_RECORDING: 'initializing',
      },
    },
    initializing: {
      invoke: {
        src: 'getUserMedia',
        onDone: {
          target: 'recording',
          actions: ({ context, event }) => {
            context.stream = event.output.stream;
            context.mediaRecorder = event.output.mediaRecorder;
          },
        },
        onError: {
          target: 'idle',
          actions: ({ context }) => {
            context.error = '録音を開始できませんでした。マイクへのアクセスを確認してください。';
          },
        },
      },
    },
    recording: {
      entry: ({ context }) => {
        if (context.mediaRecorder) {
          context.mediaRecorder.start();
        }
      },
      on: {
        STOP_RECORDING: 'transcribing',
      },
      exit: 'stopRecording',
    },
    transcribing: {
      invoke: {
        src: 'transcribeAudio',
        input: ({ context }) => ({ mediaRecorder: context.mediaRecorder }),
        onDone: {
          target: 'idle',
          actions: ({ context, event }) => {
            context.transcription = event.output;
          },
        },
        onError: {
          target: 'idle',
          actions: ({ context }) => {
            context.error = '文字起こしに失敗しました。もう一度お試しください。';
          },
        },
      },
    },
  },
});