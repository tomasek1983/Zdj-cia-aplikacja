
import React from 'react';
import { CreativeTool } from '../types';
import { ImageIcon, EditIcon, VideoIcon, SparklesIcon } from './Icons';

interface HeaderProps {
  activeTool: CreativeTool;
  setActiveTool: (tool: CreativeTool) => void;
}

// Poprawka: Zastąpiono JSX.Element przez React.ReactElement, aby rozwiązać błąd "Cannot find namespace 'JSX'".
const toolIcons: Record<CreativeTool, React.ReactElement> = {
    [CreativeTool.ImageGen]: <ImageIcon className="w-5 h-5 mr-2" />,
    [CreativeTool.ImageEdit]: <EditIcon className="w-5 h-5 mr-2" />,
    [CreativeTool.VideoGen]: <VideoIcon className="w-5 h-5 mr-2" />,
    [CreativeTool.TextAssist]: <SparklesIcon className="w-5 h-5 mr-2" />,
};

const Header: React.FC<HeaderProps> = ({ activeTool, setActiveTool }) => {
  return (
    <header className="bg-surface p-4 shadow-lg border-b border-border-color">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center">
            <SparklesIcon className="w-7 h-7 mr-2 text-primary"/>
            Pakiet Kreatywny Gemini
        </h1>
        <nav className="flex items-center space-x-2 bg-brand-bg p-1 rounded-lg">
          {Object.values(CreativeTool).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTool === tool
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface hover:text-text-main'
              }`}
            >
              {toolIcons[tool]}
              <span className="hidden sm:inline">{tool}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
