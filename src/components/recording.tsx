"use client";

import { type FC } from "react";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";

export const maxDuration = 30;

export const Recording: FC = () => {
  const { transcription, state, error, startRecording, stopRecording } =
    useVoiceRecognition();

    return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md sm:min-w-[360px] md:min-w-[480px] lg:min-w-[640px] bg-white rounded-lg shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">文字起こし内容:</h2>
        <p className="bg-gray-100 p-3 rounded">
          {(state.matches("idle") && !transcription) && (<span className="text-gray-500 italic">発話を開始してください</span>)}
          {(state.matches("idle") && !!transcription) && (<span className="text-gray-500 italic">{transcription}</span>)}
          {(state.matches("initializing") || state.matches("recording")) && (<span className="text-gray-500 italic">録音中...</span>)}
          {state.matches("transcribing") && (<span className="text-gray-500 italic">文字起こし中...</span>
          )}
        </p>
      </div>
      {error && (<div className="w-full max-w-md mb-8 p-3 bg-red-100 text-red-700 rounded text-xs">{error}</div>)}
      <form className="w-full max-w-md">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={state.matches("recording") ? stopRecording : startRecording}
            disabled={state.matches("transcribing")}
            className={`w-[200px] rounded-full px-6 py-3 text-lg font-semibold text-white disabled:opacity-50 transition-colors 
              ${(state.matches("initializing") || state.matches("recording")) && "bg-red-600 hover:bg-red-700"}
              ${state.matches("idle") && "bg-blue-600 hover:bg-blue-700"}
              ${state.matches("transcribing") && "bg-gray-400"}`}
          >
            {state.matches("idle") && "発話開始"}
            {(state.matches("initializing") || state.matches("recording")) && "発話終了"}
            {state.matches("transcribing") && "文字起こし中..."}
          </button>
        </div>
      </form>
    </div>
  );
};