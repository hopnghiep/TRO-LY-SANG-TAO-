
import { GeneratedIdea, IdeaCategory } from '../types';

const STORAGE_KEY = 'creative_ai_ideas';

/**
 * Loads all saved ideas from localStorage.
 */
export const loadIdeas = (): GeneratedIdea[] => {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    // Add type assertion here to inform TypeScript about the expected structure.
    return jsonString ? (JSON.parse(jsonString) as GeneratedIdea[]) : [];
  } catch (error) {
    console.error("Error loading ideas from localStorage:", error);
    return [];
  }
};

/**
 * Saves a new idea to localStorage.
 * @param idea The idea to save.
 */
export const saveIdea = (idea: GeneratedIdea): GeneratedIdea[] => {
  try {
    const ideas = loadIdeas();
    const newIdeas = [...ideas, idea];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas));
    return newIdeas;
  } catch (error) {
    console.error("Error saving idea to localStorage:", error);
    return loadIdeas(); // Return current state without the failed save
  }
};

/**
 * Updates an existing idea in localStorage.
 * @param id The ID of the idea to update.
 * @param updates Partial updates to apply to the idea.
 */
export const updateIdea = (id: string, updates: Partial<GeneratedIdea>): GeneratedIdea[] => {
  try {
    const ideas = loadIdeas();
    const updatedIdeas = ideas.map((idea) =>
      idea.id === id ? { ...idea, ...updates } as GeneratedIdea : idea
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIdeas));
    return updatedIdeas;
  } catch (error) {
    console.error("Error updating idea in localStorage:", error);
    return loadIdeas();
  }
};

/**
 * Deletes an idea from localStorage.
 * @param id The ID of the idea to delete.
 */
export const deleteIdea = (id: string): GeneratedIdea[] => {
  try {
    const ideas = loadIdeas();
    const newIdeas = ideas.filter((idea) => idea.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdeas));
    return newIdeas;
  } catch (error) {
    console.error("Error deleting idea from localStorage:", error);
    return loadIdeas();
  }
};
