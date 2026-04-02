
import React, { useState } from 'react';
import { GeneratedIdea, IdeaCategory } from '../types';
import SavedIdeaCard from './SavedIdeaCard';
import { SparklesIcon } from './Icons';
import { CATEGORY_LABELS, ALL_CATEGORY_LABEL } from '../constants';

interface CreativeHistoryProps {
  savedIdeas: GeneratedIdea[];
  onUpdateIdea: (id: string, updates: Partial<GeneratedIdea>) => void;
  onDeleteIdea: (id: string) => void;
}

const CreativeHistory: React.FC<CreativeHistoryProps> = ({ savedIdeas, onUpdateIdea, onDeleteIdea }) => {
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | typeof ALL_CATEGORY_LABEL>(ALL_CATEGORY_LABEL);

  const filteredIdeas = savedIdeas
    .filter(idea => filterCategory === ALL_CATEGORY_LABEL || idea.category === filterCategory)
    .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

  if (savedIdeas.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-xl mt-8">
        <SparklesIcon className="w-16 h-16 mx-auto text-gray-600 mb-4"/>
        <h2 className="text-2xl font-bold text-gray-400">Lịch Sử Sáng Tạo của bạn</h2>
        <p className="text-gray-500 mt-2">Các ý tưởng bạn tạo ra sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  const allCategories = [ALL_CATEGORY_LABEL, ...Object.keys(CATEGORY_LABELS)] as (IdeaCategory | typeof ALL_CATEGORY_LABEL)[];

  return (
    <div className="mt-12 w-full">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Lịch Sử Sáng Tạo</h2>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
              filterCategory === cat
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            aria-pressed={filterCategory === cat}
          >
            {cat === ALL_CATEGORY_LABEL ? ALL_CATEGORY_LABEL : CATEGORY_LABELS[cat as IdeaCategory]}
          </button>
        ))}
      </div>

      {filteredIdeas.length === 0 ? (
        <div className="text-center p-8 bg-gray-800/50 text-gray-400 border border-gray-700 rounded-xl">
          <p className="text-lg">Không tìm thấy ý tưởng nào trong danh mục <span className="font-semibold text-purple-400">"{filterCategory === ALL_CATEGORY_LABEL ? 'Tất Cả' : CATEGORY_LABELS[filterCategory as IdeaCategory]}"</span>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <SavedIdeaCard
              key={idea.id}
              idea={idea}
              onUpdate={onUpdateIdea}
              onDelete={onDeleteIdea}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CreativeHistory;