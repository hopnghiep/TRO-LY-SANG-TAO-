
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { IdeaCategory, Attachment, Language, PromptMode } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getOutlineSchema = (lang: Language) => {
    const isEn = lang === Language.EN;
    return {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: isEn ? "Main title for the outline, based on the original idea." : "Tiêu đề chính cho dàn ý, dựa trên ý tưởng gốc.",
            },
            outline: {
                type: Type.ARRAY,
                description: isEn ? "Main sections of the outline." : "Các phần chính của dàn ý.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        section: {
                            type: Type.STRING,
                            description: isEn ? "Title of a section in the outline." : "Tiêu đề của một phần trong dàn ý.",
                        },
                        points: {
                            type: Type.ARRAY,
                            description: isEn ? "Bullet points or details for this section." : "Các ý nhỏ hoặc chi tiết trong phần này.",
                            items: {
                                type: Type.STRING,
                            },
                        },
                    },
                    required: ["section", "points"],
                },
            },
        },
        required: ["title", "outline"],
    };
};

const generatePrompt = (category: IdeaCategory, prompt: string, language: Language, targetLanguage?: Language, promptMode?: PromptMode): string => {
    const isEn = language === Language.EN;
    // Default target language to interface language if not specified
    const targetLang = targetLanguage || language;
    const isTargetEn = targetLang === Language.EN;

    switch (category) {
        case IdeaCategory.GENERAL:
            return isEn
                ? `Act as a creative expert. Based on the following topic: "${prompt}", generate a list of 5 unique and unexpected ideas. Present them as a concise bulleted list.`
                : `Hãy đóng vai một chuyên gia sáng tạo. Dựa trên chủ đề sau: "${prompt}", hãy tạo ra một danh sách gồm 5 ý tưởng độc đáo và bất ngờ. Trình bày dưới dạng danh sách có gạch đầu dòng súc tích.`;
        case IdeaCategory.UNBLOCK:
            return isEn
                ? `I am stuck on ideas for the topic: "${prompt}". Pose 5 thought-provoking, deep, and challenging questions to help me see the problem from a new perspective and spark inspiration.`
                : `Tôi đang bị bế tắc ý tưởng với chủ đề: "${prompt}". Hãy đặt ra 5 câu hỏi gợi mở, sâu sắc và thách thức để giúp tôi nhìn vấn đề từ một góc độ mới và khơi lại nguồn cảm hứng.`;
        case IdeaCategory.OUTLINE:
             return isEn
                ? `Act as a project planner. Based on the following main idea: "${prompt}", develop a detailed outline.`
                : `Hãy đóng vai một người lập kế hoạch dự án. Dựa trên ý tưởng chính sau: "${prompt}", hãy phát triển một dàn ý chi tiết.`;
        case IdeaCategory.PROMPT:
             // MODE 1: OPTIMIZE (Tối ưu hóa ý tưởng thành Prompt chuẩn)
             if (promptMode === PromptMode.OPTIMIZE || !promptMode) {
                 if (isEn) {
                     return `Act as a professional Prompt Engineer. The user has a rough idea or request: "${prompt}".

Your task is to rewrite this into a detailed, well-structured, and effective "Prompt" to send to an Advanced AI model (like Gemini, ChatGPT, Claude).

Structure your answer as follows:
1. **Goal Analysis**: Briefly summarize the user's intent.
2. **Optimized Prompt**: This is the most important part. Write a complete prompt in ${isTargetEn ? 'English' : 'Vietnamese'}, including:
   - **Persona**: AI Role (e.g., Marketing Expert, Senior Developer...).
   - **Context**: The context of the task.
   - **Task**: Specific, step-by-step instructions.
   - **Constraints**: Limitations (length, style, negatives).
   - **Format**: Desired output format (JSON, Markdown, Table...).
3. **Tips**: 1-2 tips to use this prompt effectively.`;
                 } else {
                     return `Hãy đóng vai một Kỹ sư Prompt (Prompt Engineer) chuyên nghiệp. Người dùng có một ý tưởng sơ khai hoặc một yêu cầu như sau: "${prompt}".

Nhiệm vụ của bạn là viết lại yêu cầu này thành một "Prompt" (câu lệnh) chi tiết, cấu trúc tốt và hiệu quả để gửi cho một mô hình AI Tiên tiến (như Gemini, ChatGPT, Claude).

Hãy trình bày câu trả lời theo cấu trúc sau:
1. **Phân tích mục tiêu**: Tóm tắt ngắn gọn mục đích của người dùng.
2. **Prompt Tối Ưu**: Đây là phần quan trọng nhất. Hãy viết nội dung của Prompt tối ưu này hoàn toàn bằng ${isTargetEn ? 'Tiếng Anh' : 'Tiếng Việt'}, bao gồm:
   - **Persona**: Vai trò của AI (ví dụ: Chuyên gia Marketing, Lập trình viên Senior...).
   - **Context**: Bối cảnh nhiệm vụ.
   - **Task**: Nhiệm vụ cụ thể, rõ ràng từng bước.
   - **Constraints**: Các giới hạn (độ dài, phong cách, những điều không được làm).
   - **Format**: Định dạng đầu ra mong muốn (JSON, Markdown, Table...).
3. **Mẹo bổ sung**: 1-2 lời khuyên để người dùng sử dụng prompt này hiệu quả hơn.`;
                 }
             } 
             // MODE 2: CUSTOM / APP SPECIFIC (Tạo Prompt theo yêu cầu cụ thể để copy cho app khác)
             else {
                 if (isEn) {
                     return `Act as an expert Prompt Generator for various AI tools (Midjourney, Stable Diffusion, ChatGPT, Claude, etc.).
                     
User Request: "${prompt}"

Target Language for Output: ${isTargetEn ? 'English' : 'Vietnamese'}.

Your task:
1. Analyze the user's request to identify the target application (e.g., Image Generation, Coding, Creative Writing) or specific style/format required.
2. Generate ONLY the high-quality prompt(s) ready to be copied and pasted.
3. If the request is for an image (Midjourney/Dall-E), provide the prompt in English with appropriate parameters (e.g., --ar 16:9, --v 6.0) regardless of the target language setting, unless specified otherwise.
4. If the request is for text/code, provide a highly effective prompt in the Target Language.

Output Format:
- **Application/Type**: [Name of App or Type]
- **Prompt to Copy**:
\`\`\`text
[The Prompt content goes here]
\`\`\`
- **Explanation (Optional)**: Brief note on why this prompt works.`;
                 } else {
                     return `Hãy đóng vai một chuyên gia Tạo Prompt cho nhiều công cụ AI khác nhau (Midjourney, Stable Diffusion, ChatGPT, Claude, v.v.).

Yêu cầu của người dùng: "${prompt}"

Ngôn ngữ mục tiêu cho Prompt: ${isTargetEn ? 'Tiếng Anh' : 'Tiếng Việt'}.

Nhiệm vụ của bạn:
1. Phân tích yêu cầu để xác định ứng dụng mục tiêu (ví dụ: Tạo ảnh, Viết code, Viết văn) hoặc định dạng cụ thể.
2. Chỉ tạo ra các nội dung Prompt chất lượng cao, sẵn sàng để copy và dán sang ứng dụng khác.
3. Nếu là prompt tạo ảnh (Midjourney/Dall-E), hãy viết prompt bằng Tiếng Anh kèm các tham số phù hợp (ví dụ: --ar 16:9) bất kể cài đặt ngôn ngữ, trừ khi người dùng yêu cầu khác.
4. Nếu là prompt văn bản/code, hãy viết prompt bằng Ngôn ngữ mục tiêu.

Định dạng đầu ra:
- **Ứng dụng/Loại**: [Tên App hoặc Loại prompt]
- **Nội dung Prompt (Copy)**:
\`\`\`text
[Nội dung prompt ở đây]
\`\`\`
- **Giải thích (Tùy chọn)**: Ghi chú ngắn gọn tại sao prompt này hiệu quả.`;
                 }
             }

        default:
            return prompt;
    }
}

// Helper to decode Base64 to string with proper UTF-8 handling
const decodeBase64ToText = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        return "";
    }
}

export const generateCreativeContent = async (category: IdeaCategory, prompt: string, language: Language = Language.VI, attachments?: Attachment[], targetLanguage?: Language, promptMode?: PromptMode): Promise<any> => {
    try {
        if (category === IdeaCategory.IMAGE) {
            // This category is for generating new images from text
            const imagePrompt = language === Language.EN 
                ? `Create an artistic, imaginative image based on the following description: ${prompt}`
                : `Tạo một hình ảnh nghệ thuật, giàu trí tưởng tượng dựa trên mô tả sau: ${prompt}`;

            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }

        // Handle multimodal input for other categories
        const contents: any[] = [];
        if (attachments && attachments.length > 0) {
            for (const file of attachments) {
                // If the file is a text-based format, decode it and send as text
                if (file.mimeType.startsWith('text/') || 
                    file.mimeType === 'application/json' ||
                    file.mimeType.includes('csv') ||
                    file.mimeType.includes('xml')) {
                    
                    const textContent = decodeBase64ToText(file.data);
                    contents.push({
                        text: `[${language === Language.EN ? 'Attachment Content' : 'Nội dung tệp đính kèm'}: ${file.name}]\n${textContent}\n---`
                    });
                } else {
                    // For Images, PDF, Video, Audio
                    contents.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data,
                        },
                    });
                }
            }
        }
        contents.push({ text: generatePrompt(category, prompt, language, targetLanguage, promptMode) });

        if (category === IdeaCategory.OUTLINE) {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Supports multimodal input
                contents: { parts: contents },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: getOutlineSchema(language),
                },
            });
            return JSON.parse(response.text);
        } else {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Supports multimodal input
                contents: { parts: contents },
             });
             return response.text;
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(language === Language.EN ? "Unable to generate content. Please try again." : "Không thể tạo nội dung. Vui lòng thử lại.");
    }
};