
import { IdeaCategory, Language, PromptMode } from './types';

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  [IdeaCategory.GENERAL]: 'Ý Tưởng Chung',
  [IdeaCategory.OUTLINE]: 'Dàn Ý Chi Tiết',
  [IdeaCategory.UNBLOCK]: 'Gỡ Rối Ý Tưởng',
  [IdeaCategory.PROMPT]: 'Tạo Prompt',
  [IdeaCategory.IMAGE]: 'Tạo Hình Ảnh',
};

export const CATEGORY_LABELS_EN: Record<IdeaCategory, string> = {
  [IdeaCategory.GENERAL]: 'General Ideas',
  [IdeaCategory.OUTLINE]: 'Detailed Outline',
  [IdeaCategory.UNBLOCK]: 'Unblock Ideas',
  [IdeaCategory.PROMPT]: 'Create Prompt',
  [IdeaCategory.IMAGE]: 'Generate Image',
};

export const PROMPT_MODE_LABELS: Record<PromptMode, string> = {
  [PromptMode.OPTIMIZE]: 'Tối ưu hóa',
  [PromptMode.CUSTOM]: 'Theo yêu cầu',
};

export const PROMPT_MODE_LABELS_EN: Record<PromptMode, string> = {
  [PromptMode.OPTIMIZE]: 'Optimize Idea',
  [PromptMode.CUSTOM]: 'Custom / App Specific',
};

export const ALL_CATEGORY_LABEL = 'Tất Cả';