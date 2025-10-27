
import React, { useState } from 'react';
import Header from './components/Header';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import TextAssistant from './components/TextAssistant';
import { CreativeTool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<CreativeTool>(CreativeTool.ImageGen);

  const renderActiveTool = () => {
    switch (activeTool) {
      case CreativeTool.ImageGen:
        return <ImageGenerator />;
      case CreativeTool.ImageEdit:
        return <ImageEditor />;
      case CreativeTool.VideoGen:
        return <VideoGenerator />;
      case CreativeTool.TextAssist:
        return <TextAssistant />;
      default:
        return <ImageGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <Header activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="container mx-auto">
        {renderActiveTool()}
      </main>
      <footer className="text-center p-4 text-text-secondary text-sm border-t border-border-color mt-8">
        <p>&copy; {new Date().getFullYear()} Pakiet Kreatywny Gemini. Zasilane przez Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
