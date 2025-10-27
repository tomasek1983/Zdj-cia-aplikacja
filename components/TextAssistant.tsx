
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import { SparklesIcon } from './Icons';

type Model = 'gemini-flash-lite-latest' | 'gemini-2.5-pro';

const TextAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Wyjaśnij w prostych słowach, czym jest informatyka kwantowa.');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model>('gemini-flash-lite-latest');

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Proszę wpisać treść polecenia.');
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const genAIResponse = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });
      setResponse(genAIResponse.text);
    } catch (e) {
      const error = e as Error;
      console.error('Text generation error:', error);
      setError(`Nie udało się uzyskać odpowiedzi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-surface p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Asystent AI</h2>
        <p className="text-center text-text-secondary mb-6">Twój wszechstronny partner do analizy, edycji i tworzenia treści. Wybierz model w zależności od potrzeb.</p>

        <div className="flex justify-center mb-6">
            <div className="flex rounded-lg p-1 bg-brand-bg border border-border-color">
                <button
                    onClick={() => setSelectedModel('gemini-flash-lite-latest')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${selectedModel === 'gemini-flash-lite-latest' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface'}`}
                >
                    Szybki (Flash Lite)
                </button>
                <button
                    onClick={() => setSelectedModel('gemini-2.5-pro')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${selectedModel === 'gemini-2.5-pro' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface'}`}
                >
                    Złożony (Pro)
                </button>
            </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Zapytaj mnie o cokolwiek..."
            className="w-full p-3 bg-brand-bg border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-main h-40 resize-y"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" />Wyślij</>}
          </button>
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-8 w-full">
            {loading && (
                <div className="w-full min-h-[10rem] bg-brand-bg rounded-lg flex flex-col items-center justify-center border border-dashed border-border-color">
                    <Spinner />
                    <p className="mt-4 text-text-secondary">Myślenie...</p>
                </div>
            )}
            {response && (
                <div className="prose prose-invert max-w-none bg-brand-bg p-4 rounded-lg border border-border-color">
                    <pre className="whitespace-pre-wrap font-sans text-text-main">{response}</pre>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TextAssistant;
