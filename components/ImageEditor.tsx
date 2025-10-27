
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import Spinner from './Spinner';
import { UploadIcon, EditIcon } from './Icons';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Dodaj do zdjęcia filtr retro w stylu vintage.');
  const [loading, setLoading] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; dataUrl: string; } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Proszę przesłać prawidłowy plik obrazu.');
        return;
      }
      setEditedImage(null);
      setError(null);
      const base64 = await fileToBase64(file);
      const dataUrl = URL.createObjectURL(file);
      setOriginalImage({ file, base64, dataUrl });
    }
  };

  const handleEdit = async () => {
    if (!prompt || !originalImage) {
      setError('Proszę przesłać obraz i wpisać polecenie edycji.');
      return;
    }
    setLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: originalImage.base64,
                mimeType: originalImage.file.type,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        setEditedImage(`data:${part.inlineData.mimeType};base64,${base64ImageBytes}`);
      } else {
        setError('Nie można było edytować obrazu. Model mógł nie zwrócić obrazu. Spróbuj innego polecenia.');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Image editing error:', error);
      setError(`Nie udało się edytować obrazu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-surface p-6 rounded-xl shadow-lg border border-border-color">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">Magiczny Edytor Obrazów</h2>
        <p className="text-center text-text-secondary mb-6">Prześlij obraz i opisz zmiany, które chcesz zobaczyć.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div 
            className="w-full aspect-square bg-brand-bg rounded-lg border-2 border-dashed border-border-color flex flex-col justify-center items-center text-text-secondary cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            {originalImage ? (
              <img src={originalImage.dataUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-lg"/>
            ) : (
              <>
                <UploadIcon className="w-12 h-12 mb-2" />
                <p>Kliknij lub przeciągnij, aby przesłać obraz</p>
              </>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="np. Usuń osobę w tle"
              className="w-full p-3 bg-brand-bg border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-main h-28 resize-none"
              rows={3}
            />
            <button
              onClick={handleEdit}
              disabled={loading || !originalImage}
              className="w-full flex justify-center items-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner /> : <><EditIcon className="w-5 h-5 mr-2" />Zastosuj Edycję</>}
            </button>

            {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
            
            <div className="w-full aspect-square bg-brand-bg rounded-lg border-2 border-dashed border-border-color flex justify-center items-center mt-4">
                {loading && (
                    <div className="flex flex-col items-center text-text-secondary">
                        <Spinner />
                        <p className="mt-4">Stosowanie magicznych edycji...</p>
                    </div>
                )}
                {editedImage && <img src={editedImage} alt="Edited" className="max-h-full max-w-full object-contain rounded-lg"/>}
                {!editedImage && !loading && <p className="text-text-secondary p-4 text-center">Twój edytowany obraz pojawi się tutaj.</p>}
            </div>
            {editedImage && (
              <a 
                  href={editedImage} 
                  download="edited-image.png"
                  className="block text-center w-full mt-2 bg-surface hover:bg-brand-bg border border-border-color text-text-main font-bold py-2 px-4 rounded-lg transition-colors"
              >
                  Pobierz Edytowany Obraz
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
