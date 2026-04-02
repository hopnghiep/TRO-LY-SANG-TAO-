
export enum IdeaCategory {
  GENERAL = 'GENERAL',
  OUTLINE = 'OUTLINE',
  UNBLOCK = 'UNBLOCK',
  IMAGE = 'IMAGE',
  PROMPT = 'PROMPT',
}

export enum Language {
  VI = 'VI',
  EN = 'EN',
}

export enum PromptMode {
  OPTIMIZE = 'OPTIMIZE',
  CUSTOM = 'CUSTOM',
}

export interface GeneratedText {
  type: 'text';
  content: string;
  title: string;
}

export interface GeneratedOutline {
  type: 'outline';
  content: {
    title: string;
    outline: {
      section: string;
      points: string[];
    }[];
  };
  title: string;
}

export interface GeneratedImage {
  type: 'image';
  content: string; // base64 data URI
  title: string;
}

export type GeneratedIdea = (GeneratedText | GeneratedImage | GeneratedOutline) & {
  id: string; // Unique ID for storage
  timestamp: number; // Timestamp for creation
  category: IdeaCategory; // The category it was generated under
  language?: Language; // The language of the generated content
};

export interface Attachment {
  data: string;
  mimeType: string;
  name?: string; // Optional: original file name
}