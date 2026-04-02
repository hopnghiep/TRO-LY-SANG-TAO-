
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs
import Header from './components/Header';
import InputArea from './components/InputArea';
import ResultsDisplay from './components/ResultsDisplay';
import CreativeHistory from './components/CreativeHistory'; // New component
import { IdeaCategory, GeneratedIdea, Attachment, GeneratedOutline, Language, PromptMode } from './types'; // Import GeneratedOutline type
import { generateCreativeContent } from './services/geminiService';
import { CATEGORY_LABELS, CATEGORY_LABELS_EN, PROMPT_MODE_LABELS, PROMPT_MODE_LABELS_EN } from './constants';
import { RefreshCwIcon } from './components/Icons';
import { loadIdeas, saveIdea, updateIdea, deleteIdea } from './services/localStorageService'; // Import localStorage service

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<IdeaCategory>(IdeaCategory.GENERAL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationResult, setCurrentGenerationResult] = useState<GeneratedIdea | null>(null); // For the single, latest result
  const [savedIdeas, setSavedIdeas] = useState<GeneratedIdea[]>([]); // For all persistent ideas
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const [language, setLanguage] = useState<Language>(Language.VI);
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.VI);
  const [promptMode, setPromptMode] = useState<PromptMode>(PromptMode.OPTIMIZE);

  // Load saved ideas from localStorage on initial render
  useEffect(() => {
    setSavedIdeas(loadIdeas());
  }, []);

  // Sync target language to general language when general language changes, 
  // but let user override it afterwards for specific tasks.
  useEffect(() => {
    setTargetLanguage(language);
  }, [language]);

  const handleGenerate = async () => {
    if (!userInput.trim() && uploadedFiles.length === 0) {
      setError(language === Language.VI ? "Vui lòng nhập chủ đề hoặc tải tệp lên." : "Please enter a topic or upload a file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentGenerationResult(null); // Clear previous current result

    try {
      const result = await generateCreativeContent(activeCategory, userInput, language, uploadedFiles, targetLanguage, promptMode);
      let newIdea: GeneratedIdea; // Declare newIdea here

      const categoryLabel = language === Language.VI ? CATEGORY_LABELS[activeCategory] : CATEGORY_LABELS_EN[activeCategory];
      const titlePrefix = language === Language.VI ? 'cho' : 'for';
      const fileSuffix = language === Language.VI ? 'tệp' : 'files';
      
      let promptModeLabel = '';
      if (activeCategory === IdeaCategory.PROMPT) {
          promptModeLabel = ` (${language === Language.VI ? PROMPT_MODE_LABELS[promptMode] : PROMPT_MODE_LABELS_EN[promptMode]})`;
      }

      const title = `${categoryLabel}${promptModeLabel} ${titlePrefix}: "${userInput.substring(0, 30)}${userInput.length > 30 ? '...' : ''}"${uploadedFiles.length > 0 ? ` (+${uploadedFiles.length} ${fileSuffix})` : ''}`;

      switch (activeCategory) {
        case IdeaCategory.IMAGE:
          newIdea = {
            type: 'image',
            content: result as string, // result is string for image
            title,
            id: uuidv4(),
            timestamp: Date.now(),
            category: activeCategory,
            language: language,
          };
          break;
        case IdeaCategory.OUTLINE:
          newIdea = {
            type: 'outline',
            content: result as GeneratedOutline['content'], // result is outline content
            title,
            id: uuidv4(),
            timestamp: Date.now(),
            category: activeCategory,
            language: language,
          };
          break;
        default: // GENERAL, UNBLOCK, PROMPT
          newIdea = {
            type: 'text',
            content: result as string, // result is string for text
            title,
            id: uuidv4(),
            timestamp: Date.now(),
            category: activeCategory,
            language: language,
          };
          break;
      }

      setCurrentGenerationResult(newIdea); // Display latest result
      setSavedIdeas(saveIdea(newIdea)); // Save to localStorage and update state
      setUploadedFiles([]); // Clear files after successful generation
      setUserInput(''); // Clear user input after generation
    } catch (e: any) {
      setError(e.message || (language === Language.VI ? 'Đã có lỗi xảy ra.' : 'An error occurred.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUserInput('');
    setActiveCategory(IdeaCategory.GENERAL);
    setIsLoading(false);
    setError(null);
    setCurrentGenerationResult(null); // Clear current result
    setUploadedFiles([]);
  };

  const handleUpdateIdea = (id: string, updates: Partial<GeneratedIdea>) => {
    setSavedIdeas(updateIdea(id, updates));
  };

  const handleDeleteIdea = (id: string) => {
    setSavedIdeas(deleteIdea(id));
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="w-full px-4 py-8 flex flex-col items-center gap-8">
        <Header />
        <InputArea
          userInput={userInput}
          setUserInput={setUserInput}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          language={language}
          setLanguage={setLanguage}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          promptMode={promptMode}
          setPromptMode={setPromptMode}
        />
        <div className="w-full mt-8">
            <ResultsDisplay isLoading={isLoading} error={error} ideas={currentGenerationResult ? [currentGenerationResult] : []} />
        </div>
        {(userInput.trim() || uploadedFiles.length > 0 || currentGenerationResult || error) && (
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="mt-8 px-6 py-3 bg-gray-700 text-gray-300 font-semibold rounded-full flex items-center gap-2 hover:bg-gray-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Bắt đầu lại"
          >
            <RefreshCwIcon className="w-5 h-5" />
            {language === Language.VI ? 'Bắt đầu lại' : 'Start Over'}
          </button>
        )}

        <CreativeHistory
          savedIdeas={savedIdeas}
          onUpdateIdea={handleUpdateIdea}
          onDeleteIdea={handleDeleteIdea}
        />
      </div>
    </div>
  );
};

export default App;