
import React, { useState, useCallback } from 'react';
import { GeneratedIdea, GeneratedOutline } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

const renderTextContent = (content: string) => {
    return content.split('\n').map((line, index) => {
        line = line.trim();
        if (line.startsWith('- ')) {
            return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
        }
        if (line.match(/^\d+\./)) {
             return <li key={index} className="ml-5 list-decimal">{line.substring(line.indexOf('.') + 1).trim()}</li>;
        }
        return <p key={index} className="mb-2">{line}</p>;
    });
};

const renderOutlineContent = (content: GeneratedOutline['content']) => (
    <div>
        <h3 className="text-xl font-bold text-purple-300 mb-3">{content.title}</h3>
        {content.outline.map((section, idx) => (
            <div key={idx} className="mb-4">
                <h4 className="font-semibold text-pink-400">{section.section}</h4>
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-300">
                    {section.points.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);


const IdeaCard: React.FC<{ idea: GeneratedIdea }> = ({ idea }) => {
    const [copied, setCopied] = useState(false);
    
    const getTextToCopy = useCallback(() => {
        // Idea type can be 'text', 'outline', or 'image'.
        if (idea.type === 'text') {
            return idea.content;
        }
        if (idea.type === 'outline') {
            let text = `${idea.content.title}\n\n`;
            idea.content.outline.forEach(section => {
                text += `${section.section}\n`;
                section.points.forEach(point => {
                    text += `- ${point}\n`;
                });
                text += '\n';
            });
            return text;
        }
        return '';
    }, [idea]);

    const handleCopy = () => {
        const textToCopy = getTextToCopy();
        if(textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    return (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-6 w-full relative group">
            <h2 className="text-lg font-semibold text-purple-300 mb-4">{idea.title}</h2>
            {idea.type === 'image' ? (
                <img src={idea.content} alt="Generated Art" className="rounded-lg w-full h-auto object-cover" />
            ) : idea.type === 'outline' ? (
                renderOutlineContent(idea.content)
            ) : (
                <div className="text-gray-200 space-y-2">{renderTextContent(idea.content)}</div>
            )}

            { (idea.type === 'text' || idea.type === 'outline') &&
                <button 
                    onClick={handleCopy}
                    className="absolute top-4 right-4 p-2 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Copy to clipboard"
                >
                   {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                </button>
            }
        </div>
    );
};

export default IdeaCard;