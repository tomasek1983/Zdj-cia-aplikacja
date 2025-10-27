import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Operation } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import Spinner from './Spinner';
import { UploadIcon, VideoIcon } from './Icons';

type AspectRatio = '16:9' | '9:16';

// FIX: Inlined the type definition for `window.aistudio` to resolve declaration conflict errors.
// This avoids creating a separate named interface which was causing type resolution issues.
declare global {
    interface Window {
        aistudio: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        };
    }
}

const loadingMessages = [
    "Rozgrzewanie cyfrowego fotela reżyserskiego...",
    "Pisanie scenariusza pierwszych scen...",
    "Obsadzanie pikseli w ich rolach...",
    "Renderowanie sekwencji otwierającej...",
    "To może potrwać kilka minut, wielka sztuka potrzebuje czasu!",
    "Dopracowywanie ostatnich klatek...",
    "Prawie gotowe na premierę...",
];

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Epickie, kinowe ujęcie tego obiektu spadającego przez chmury.');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; base64: string; dataUrl: string; } | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<number | null>(null);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
        return hasKey;
    }
    setError("Nie znaleziono kontekstu AI Studio. Ta funkcja może nie działać zgodnie z oczekiwaniami.");
    setApiKeySelected(false);
    return false;
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSelectKey = async () => {
    if(window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog to avoid race conditions
        setApiKeySelected(true);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Proszę przesłać prawidłowy plik obrazu.');
        return;
      }
      setGeneratedVideoUrl(null);
      setError(null);
      const base64 = await fileToBase64(file);
      const dataUrl = URL.createObjectURL(file);
      setUploadedImage({ file, base64, dataUrl });
    }
  };

  const pollOperation = useCallback(async (ai: GoogleGenAI, op: Operation) => {
    try {
        let operation = op;
        while (!operation.done) {
            await new Promise(resolve => { pollingRef.current = window.setTimeout(resolve, 10000); });
            operation = await ai.operations.getVideosOperation({ operation });
        }

        if (operation.error) {
            throw new Error(operation.error.message || 'Generowanie wideo nie powiodło się w trakcie operacji.');
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) throw new Error(`Nie udało się pobrać wideo: ${videoResponse.statusText}`);
            const videoBlob = await videoResponse.blob();
            setGeneratedVideoUrl(URL.createObjectURL(videoBlob));
        } else {
            throw new Error('Nie znaleziono URI wideo w zakończonej operacji.');
        }
    } catch(e) {
        const error = e as Error;
        console.error("Polling error:", error);
        setError(`Wystąpił błąd podczas generowania wideo: ${error.message}`);
        if(error.message.includes("Requested entity was not found")){
            setError("Twój klucz API jest nieprawidłowy. Wybierz nowy klucz i spróbuj ponownie.");
            setApiKeySelected(false);
        }
    } finally {
        setLoading(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Proszę przesłać obraz początkowy.');
      return;
    }
    if (!await checkApiKey()) {
        setError("Proszę wybrać klucz API przed wygenerowaniem wideo.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);
    if(pollingRef.current) clearTimeout(pollingRef.current);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: uploadedImage.base64,
          mimeType: uploadedImage.file.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });
      pollOperation(ai, operation);
    } catch (e) {
        const error = e as Error;
        console.error('Video generation error:', error);
        setError(`Nie udało się rozpocząć generowania wideo: ${error.message}`);
        if(error.message.includes("Requested entity was not found")){
            setError("Twój klucz API wydaje się nieprawidłowy. Wybierz go ponownie i spróbuj jeszcze raz.");
            setApiKeySelected(false);
        }
        setLoading(false);
    }
  };

  if (apiKeySelected === null) {
    return <div className="p-8 flex justify-center items-center h-96"><Spinner /></div>;
  }
  
  if (!apiKeySelected) {
      return (
          <div className="p-8 flex flex-col items-center justify-center text-center bg-surface m-8 rounded-lg border border-border-color">
              <h3 className="text-xl font-bold mb-2">Klucz API Wymagany do Generowania Wideo</h3>
              <p className="text-text-secondary mb-4 max-w-md">Model Veo wymaga klucza API wybranego przez użytkownika. Wybierz klucz, aby włączyć tę funkcję. Pamiętaj, że korzystanie z tego modelu może wiązać się z opłatami.</p>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mb-4">Dowiedz się o rozliczeniach</a>
              <button onClick={handleSelectKey} className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors">Wybierz Klucz API</button>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-surface p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Syntezator Wideo AI</h2>
        <p className="text-center text-text-secondary mb-6">Ożyw swoje obrazy. Prześlij zdjęcie, dodaj polecenie i wygeneruj wideo za pomocą Veo.</p>

        <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Input */}
            <div className="flex-1 flex flex-col space-y-4">
                <div 
                    className="w-full h-48 bg-brand-bg rounded-lg border-2 border-dashed border-border-color flex flex-col justify-center items-center text-text-secondary cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    {uploadedImage ? (
                    <img src={uploadedImage.dataUrl} alt="Uploaded preview" className="max-h-full max-w-full object-contain rounded-lg"/>
                    ) : (
                    <>
                        <UploadIcon className="w-12 h-12 mb-2" />
                        <p>Prześlij obraz początkowy</p>
                    </>
                    )}
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="np. Kinowe ujęcie z drona oddalające się od tego"
                    className="w-full p-3 bg-brand-bg border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-main h-28 resize-none"
                    rows={3}
                />
                <div>
                    <span className="text-text-secondary font-medium">Proporcje Obrazu:</span>
                    <div className="flex gap-4 mt-2">
                        {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 rounded-lg font-semibold border-2 ${aspectRatio === ratio ? 'bg-primary border-primary text-white' : 'bg-brand-bg border-border-color text-text-secondary hover:border-primary'}`}>
                                {ratio} {ratio === '16:9' ? '(Poziomo)' : '(Pionowo)'}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading || !uploadedImage}
                    className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? <Spinner /> : <><VideoIcon className="w-5 h-5 mr-2" />Generuj Wideo</>}
                </button>
                {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            </div>

            {/* Right Column - Output */}
            <div className="flex-1 w-full aspect-video bg-brand-bg rounded-lg border-2 border-dashed border-border-color flex justify-center items-center">
                 {loading && (
                    <div className="flex flex-col items-center text-text-secondary p-4 text-center">
                        <Spinner />
                        <p className="mt-4 font-semibold text-text-main">{loadingMessage}</p>
                    </div>
                )}
                {generatedVideoUrl && (
                    <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-lg" />
                )}
                {!generatedVideoUrl && !loading && <p className="text-text-secondary p-4 text-center">Twoje wygenerowane wideo pojawi się tutaj.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;