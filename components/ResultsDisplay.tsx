
import React from 'react';
import { GeneratedIdea } from '../types';
import LoadingSpinner from './LoadingSpinner';
import IdeaCard from './IdeaCard';
import { SparklesIcon } from './Icons';

interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  ideas: GeneratedIdea[]; // This will now typically only contain the current generation result or be empty.
}

const WelcomeState: React.FC = () => (
    <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-xl">
        <SparklesIcon className="w-16 h-16 mx-auto text-gray-600 mb-4"/>
        <h2 className="text-2xl font-bold text-gray-400">Không gian sáng tạo của bạn</h2>
        <p className="text-gray-500 mt-2">Nhập một chủ đề và chọn một chế độ để bắt đầu quá trình sáng tạo với AI.</p>
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, ideas }) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center p-8 bg-red-900/50 text-red-300 border border-red-700 rounded-xl">{error}</div>;
  }

  // Only show welcome state if there are no ideas to display (i.e., current generation is empty)
  if (ideas.length === 0) {
    return <WelcomeState />;
  }

  return (
    <div className="grid grid-cols-1 w-full"> {/* Changed to 1 column for the main result for better focus */}
      {ideas.map((idea) => ( // Should only be one idea here now
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
};

export default ResultsDisplay;