
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { IdeaCategory, Attachment, Language, PromptMode } from '../types';
import { CATEGORY_LABELS, CATEGORY_LABELS_EN, PROMPT_MODE_LABELS, PROMPT_MODE_LABELS_EN } from '../constants';
import { SparklesIcon, ImageIcon, FileTextIcon, VideoIcon, AudioIcon, FileIcon, ClipboardIcon } from './Icons';

interface InputAreaProps {
  userInput: string;
  setUserInput: (input: string) => void;
  activeCategory: IdeaCategory;
  setActiveCategory: (category: IdeaCategory) => void;
  onGenerate: () => void;
  isLoading: boolean;
  uploadedFiles: Attachment[];
  setUploadedFiles: (files: Attachment[]) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  targetLanguage: Language;
  setTargetLanguage: (lang: Language) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
}

const MAX_FILES = 5; 
const MAX_FILE_SIZE_MB = 20; // Increased limit for video/audio

// Comprehensive list of accepted MIME types
const ACCEPTED_TYPES = [
    "image/*",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/msword", // .doc (Best effort)
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx (Best effort)
    "application/vnd.ms-powerpoint", // .ppt (Best effort)
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx (Best effort)
    "audio/*",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm"
].join(",");

const InputArea: React.FC<InputAreaProps> = ({
  userInput,
  setUserInput,
  activeCategory,
  setActiveCategory,
  onGenerate,
  isLoading,
  uploadedFiles,
  setUploadedFiles,
  language,
  setLanguage,
  targetLanguage,
  setTargetLanguage,
  promptMode,
  setPromptMode
}) => {
  const categories = Object.keys(CATEGORY_LABELS) as IdeaCategory[];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getLabel = (cat: IdeaCategory) => {
      return language === Language.VI ? CATEGORY_LABELS[cat] : CATEGORY_LABELS_EN[cat];
  };

  const getPromptModeLabel = (mode: PromptMode) => {
      return language === Language.VI ? PROMPT_MODE_LABELS[mode] : PROMPT_MODE_LABELS_EN[mode];
  }

  const getPlaceholder = () => {
    if (language === Language.VI) {
      switch (activeCategory) {
        case IdeaCategory.PROMPT:
          return promptMode === PromptMode.CUSTOM 
            ? "Mô tả prompt bạn muốn lấy (ví dụ: 'Prompt Midjourney vẽ mèo máy', 'Prompt ChatGPT đóng vai giáo viên')..."
            : "Mô tả nhiệm vụ bạn muốn AI thực hiện để được tối ưu hóa (ví dụ: 'Viết email marketing', 'Tạo code python')...";
        case IdeaCategory.IMAGE:
          return "Mô tả chi tiết hình ảnh bạn muốn tạo (ví dụ: 'Một chú mèo phi hành gia trong không gian cyberpunk')...";
        case IdeaCategory.OUTLINE:
          return "Nhập chủ đề bạn muốn lập dàn ý (ví dụ: 'Kế hoạch kinh doanh quán cà phê')...";
        case IdeaCategory.UNBLOCK:
          return "Bạn đang gặp khó khăn gì? Hãy chia sẻ để tìm hướng đi mới...";
        default:
          return "Nhập chủ đề, yêu cầu, hoặc câu hỏi về tài liệu bạn vừa tải lên...";
      }
    } else {
      switch (activeCategory) {
        case IdeaCategory.PROMPT:
          return promptMode === PromptMode.CUSTOM
            ? "Describe the prompt you need (e.g., 'Midjourney prompt for cyber cat', 'ChatGPT prompt for teacher role')..."
            : "Describe the task you want the AI to do for optimization (e.g., 'Write marketing email')...";
        case IdeaCategory.IMAGE:
          return "Describe the image you want to generate in detail...";
        case IdeaCategory.OUTLINE:
          return "Enter the topic you want to outline...";
        case IdeaCategory.UNBLOCK:
          return "What are you stuck on? Share to find a new perspective...";
        default:
          return "Enter topic, request, or question about uploaded documents...";
      }
    }
  };

  useEffect(() => {
    if (uploadedFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedFiles]);

  const addFile = useCallback((file: File) => {
    setUploadError(null);
    if (uploadedFiles.length >= MAX_FILES) {
      setUploadError(language === Language.VI ? `Chỉ được tải lên tối đa ${MAX_FILES} tệp.` : `Maximum ${MAX_FILES} files allowed.`);
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(language === Language.VI ? `Kích thước tệp không được vượt quá ${MAX_FILE_SIZE_MB}MB.` : `File size must not exceed ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove data URL prefix (e.g., "data:image/png;base64,") to get raw base64
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; 
      
      setUploadedFiles((prevFiles) => [
          ...prevFiles, 
          { 
              data: base64Data, 
              mimeType: file.type, 
              name: file.name 
          }
      ]);
    };
    reader.onerror = () => {
      setUploadError(language === Language.VI ? 'Không thể đọc tệp.' : 'Failed to read file.');
    };
    reader.readAsDataURL(file);
    return true;
  }, [uploadedFiles, setUploadedFiles, language]);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addFile(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [addFile]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [handleFileChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    // If the target is the textarea, let default behavior happen for text
    if (e.target === textAreaRef.current && e.clipboardData.files.length === 0) {
        return;
    }

    setUploadError(null);
    const items = e.clipboardData.items;
    
    // Check for files
    let hasFiles = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) {
                addFile(file);
                hasFiles = true;
            }
        }
    }

    // If we pasted files, prevent default so it doesn't try to paste text rep of file
    if (hasFiles) {
        e.preventDefault();
    }
  }, [addFile]);

  const handleRemoveFile = useCallback((indexToRemove: number) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    setUploadError(null);
  }, [setUploadedFiles]);

  const handleClearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setUploadedFiles]);

  const handlePasteClick = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setUserInput(userInput + (userInput ? '\n' : '') + text);
            textAreaRef.current?.focus();
        } else {
            setUploadError(language === Language.VI ? "Không tìm thấy văn bản trong clipboard." : "No text found in clipboard.");
        }
    } catch (err) {
        console.error("Failed to read clipboard:", err);
        setUploadError(language === Language.VI ? "Không thể truy cập clipboard. Vui lòng sử dụng Ctrl+V." : "Cannot access clipboard. Please use Ctrl+V.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isFileUploadDisabled = isLoading || activeCategory === IdeaCategory.IMAGE || uploadedFiles.length >= MAX_FILES;

  const getFileIcon = (mimeType: string) => {
      if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
      if (mimeType.startsWith('video/')) return <VideoIcon className="w-5 h-5 text-blue-400" />;
      if (mimeType.startsWith('audio/')) return <AudioIcon className="w-5 h-5 text-yellow-400" />;
      if (mimeType === 'application/pdf') return <FileTextIcon className="w-5 h-5 text-red-400" />;
      if (mimeType.includes('presentation')) return <FileTextIcon className="w-5 h-5 text-orange-400" />; // PPT
      if (mimeType.includes('word') || mimeType.includes('text') || mimeType.includes('csv') || mimeType.includes('json') || mimeType.includes('markdown')) return <FileTextIcon className="w-5 h-5 text-blue-300" />;
      return <FileIcon className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div 
        className={`w-full p-4 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 backdrop-blur-sm ${dragActive ? 'border-purple-500 ring-2 ring-purple-500' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        aria-label="Khu vực nhập liệu và tải tệp tin lên"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={ACCEPTED_TYPES}
        multiple
        onChange={(e) => handleFileChange(e.target.files)}
        disabled={isLoading}
      />

      {uploadedFiles.length > 0 ? (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex flex-wrap gap-3 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group flex items-center p-2 bg-gray-800 rounded-md border border-gray-600 gap-3 min-w-[150px]">
                        {file.mimeType.startsWith('image/') ? (
                             <img src={`data:${file.mimeType};base64,${file.data}`} alt={`Preview ${file.name}`} className="w-10 h-10 object-cover rounded-md" />
                        ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-900 rounded-md">
                                {getFileIcon(file.mimeType)}
                            </div>
                        )}
                        
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-gray-200 text-xs font-medium truncate max-w-[120px]" title={file.name}>
                                {file.name || 'Không tên'}
                            </span>
                             <span className="text-gray-500 text-[10px] truncate uppercase">
                                {file.mimeType.split('/')[1] || 'FILE'}
                            </span>
                        </div>

                        <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors duration-200 text-xs font-bold shadow-md"
                            disabled={isLoading}
                            aria-label={`Xóa tệp ${index + 1}`}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={handleClearAllFiles}
                className="w-full py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors duration-200 text-sm font-semibold"
                disabled={isLoading}
                aria-label="Xóa tất cả tệp đã tải lên"
            >
                {language === Language.VI ? "Xóa tất cả tệp" : "Clear all files"}
            </button>
        </div>
      ) : (
        <button
          onClick={triggerFileInput}
          disabled={isFileUploadDisabled}
          className={`w-full py-6 mb-4 border-2 border-dashed rounded-lg text-gray-400 flex flex-col items-center justify-center transition-all duration-200 ${
            isFileUploadDisabled
              ? 'border-gray-700 bg-gray-800 cursor-not-allowed opacity-60'
              : 'border-gray-600 hover:border-purple-500 hover:text-purple-300'
          }`}
          aria-label="Tải tệp lên hoặc kéo thả vào đây"
        >
          <div className="flex gap-2 mb-2">
              <ImageIcon className="w-6 h-6" />
              <FileTextIcon className="w-6 h-6" />
              <VideoIcon className="w-6 h-6" />
              <AudioIcon className="w-6 h-6" />
          </div>
          <p className="font-medium">
             {language === Language.VI ? "Kéo thả Ảnh, Văn bản, Video hoặc Audio vào đây" : "Drag & Drop Image, Text, Video, or Audio here"}
          </p>
          <p className="text-xs mt-1 text-gray-500">(Hỗ trợ: PDF, TXT, MD, PPT, MP4, MP3...)</p>
          {activeCategory === IdeaCategory.IMAGE && (
              <p className="text-red-400 text-xs mt-1">
                  {language === Language.VI ? "Tính năng tải tệp không khả dụng cho danh mục 'Tạo Hình Ảnh'" : "File upload not available for 'Generate Image'"}
              </p>
          )}
          {uploadedFiles.length >= MAX_FILES && (
              <p className="text-red-400 text-xs mt-1">
                  {language === Language.VI ? `Đã đạt giới hạn ${MAX_FILES} tệp.` : `Reached limit of ${MAX_FILES} files.`}
              </p>
          )}
        </button>
      )}
      {uploadError && <p className="text-red-400 text-sm mb-4">{uploadError}</p>}

      <div className="relative">
          <textarea
            ref={textAreaRef}
            className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200"
            rows={uploadedFiles.length > 0 ? 3 : 5}
            placeholder={getPlaceholder()}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
            aria-label="Trường nhập văn bản"
          />
          <button 
            onClick={handlePasteClick}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-purple-300 transition-colors"
            title={language === Language.VI ? "Dán từ Clipboard" : "Paste from Clipboard"}
          >
              <ClipboardIcon className="w-4 h-4" />
          </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={activeCategory === cat}
            >
              {getLabel(cat)}
            </button>
          ))}
        </div>

        {activeCategory === IdeaCategory.PROMPT && (
            <div className="flex flex-wrap items-center gap-4 bg-gray-700/50 p-2 rounded-lg w-fit border border-gray-600">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 font-medium">
                        {language === Language.VI ? "Chế độ:" : "Mode:"}
                    </span>
                     <div className="flex bg-gray-800 rounded-md p-0.5">
                         <button
                            onClick={() => setPromptMode(PromptMode.OPTIMIZE)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 ${promptMode === PromptMode.OPTIMIZE ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            disabled={isLoading}
                         >
                            {getPromptModeLabel(PromptMode.OPTIMIZE)}
                         </button>
                         <button
                            onClick={() => setPromptMode(PromptMode.CUSTOM)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 ${promptMode === PromptMode.CUSTOM ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            disabled={isLoading}
                         >
                            {getPromptModeLabel(PromptMode.CUSTOM)}
                         </button>
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 font-medium">
                        {language === Language.VI ? "Ngôn ngữ Prompt:" : "Prompt Language:"}
                    </span>
                    <div className="flex bg-gray-800 rounded-md p-0.5">
                         <button
                            onClick={() => setTargetLanguage(Language.VI)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 ${targetLanguage === Language.VI ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            disabled={isLoading}
                         >
                            Tiếng Việt
                         </button>
                         <button
                            onClick={() => setTargetLanguage(Language.EN)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-all duration-200 ${targetLanguage === Language.EN ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            disabled={isLoading}
                         >
                            English
                         </button>
                    </div>
                </div>
            </div>
        )}
        
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-gray-700">
             <div className="flex bg-gray-700 rounded-lg p-1">
                <button 
                    onClick={() => setLanguage(Language.VI)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${language === Language.VI ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    🇻🇳 VI
                </button>
                <button 
                    onClick={() => setLanguage(Language.EN)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${language === Language.EN ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    🇬🇧 EN
                </button>
            </div>

            <button
            onClick={onGenerate}
            disabled={isLoading || (!userInput.trim() && uploadedFiles.length === 0)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 shadow-lg ml-auto"
            aria-live="polite"
            >
            <SparklesIcon className="w-5 h-5" />
            {isLoading 
                ? (language === Language.VI ? 'Đang tạo...' : 'Generating...') 
                : (language === Language.VI ? 'Tạo ý tưởng' : 'Generate')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;