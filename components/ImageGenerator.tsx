
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Spinner from './Spinner';
import { SparklesIcon } from './Icons';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Fotorealistyczny obraz futurystycznego miasta na odległej planecie, z latającymi samochodami i strzelistymi wieżowcami, o zachodzie słońca');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Proszę wpisać treść polecenia.');
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        setGeneratedImage(`data:image/jpeg;base64,${base64ImageBytes}`);
      } else {
        setError('Nie wygenerowano obrazu. Spróbuj innego polecenia.');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Image generation error:', error);
      setError(`Nie udało się wygenerować obrazu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-surface p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Generowanie Obrazów</h2>
        <p className="text-center text-text-secondary mb-6">Twórz oszałamiające wizualizacje z opisów tekstowych za pomocą Imagen 4.</p>
        <div className="flex flex-col space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="np. Majestatyczny lew w koronie w bujnej dżungli"
            className="w-full p-3 bg-brand-bg border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-main h-28 resize-none"
            rows={3}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" />Generuj Obraz</>}
          </button>
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-8 w-full flex justify-center">
            {loading && (
                 <div className="w-full aspect-square max-w-md bg-brand-bg rounded-lg flex flex-col items-center justify-center border border-dashed border-border-color">
                    <Spinner />
                    <p className="mt-4 text-text-secondary">Generowanie Twojej wizji...</p>
                 </div>
            )}
            {generatedImage && (
                <div className="w-full max-w-md">
                    <img src={generatedImage} alt="Generated" className="rounded-lg shadow-2xl w-full h-auto" />
                    <a 
                        href={generatedImage} 
                        download="generated-image.jpg"
                        className="block text-center w-full mt-4 bg-surface hover:bg-brand-bg border border-border-color text-text-main font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Pobierz Obraz
                    </a>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
