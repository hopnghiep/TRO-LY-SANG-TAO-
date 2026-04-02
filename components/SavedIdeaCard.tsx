import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GeneratedIdea, IdeaCategory, GeneratedOutline } from '../types';
import { CopyIcon, CheckIcon, EditIcon, TrashIcon, FolderOpenIcon, EyeIcon, DownloadIcon } from './Icons';
import { CATEGORY_LABELS } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SavedIdeaCardProps {
    idea: GeneratedIdea;
    onUpdate: (id: string, updates: Partial<GeneratedIdea>) => void;
    onDelete: (id: string) => void;
}

const renderTextContentPreview = (content: string, limit: number = 150) => {
    const lines = content.split('\n');
    let preview = '';
    for (const line of lines) {
        if (preview.length + line.length < limit) {
            preview += line + '\n';
        } else {
            preview += line.substring(0, limit - preview.length) + '...';
            break;
        }
    }
    return <div className="text-gray-300 text-sm overflow-hidden max-h-24">{preview.trim() || 'Không có nội dung để hiển thị.'}</div>;
};

const renderOutlineContentPreview = (content: GeneratedOutline['content']) => (
    <div className="text-gray-300 text-sm overflow-hidden max-h-24">
        <p className="font-semibold text-purple-300">{content.title}</p>
        <ul className="list-disc list-inside ml-2 text-gray-400">
            {content.outline.slice(0, 2).map((section, idx) => (
                <li key={idx} className="truncate">{section.section}</li>
            ))}
            {content.outline.length > 2 && <li>...</li>}
        </ul>
    </div>
);

const SavedIdeaCard: React.FC<SavedIdeaCardProps> = ({ idea, onUpdate, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(idea.title);
    const [isMovingCategory, setIsMovingCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<IdeaCategory>(idea.category);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isViewingFull, setIsViewingFull] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Close download menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTextToCopy = useCallback(() => {
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
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSaveTitle = () => {
        if (newTitle.trim() && newTitle !== idea.title) {
            onUpdate(idea.id, { title: newTitle.trim() });
        }
        setIsEditingTitle(false);
    };

    const handleSaveCategory = () => {
        if (selectedCategory !== idea.category) {
            onUpdate(idea.id, { category: selectedCategory });
        }
        setIsMovingCategory(false);
    };

    const handleDelete = () => {
        onDelete(idea.id);
        setShowDeleteConfirm(false);
    };

    const getSafeFilename = (ext: string) => {
        return `${idea.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.${ext}`;
    };

    const formattedDate = new Date(idea.timestamp).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleDownload = async (format: 'txt' | 'md' | 'json' | 'png' | 'pdf') => {
        const filename = getSafeFilename(format);

        if (format === 'pdf') {
            setIsGeneratingPdf(true);
            try {
                // Create a temporary container for rendering
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.left = '-9999px';
                container.style.top = '0';
                container.style.width = '210mm';
                container.style.padding = '20mm';
                container.style.backgroundColor = '#ffffff';
                container.style.color = '#000000';
                container.style.fontFamily = 'Arial, sans-serif';
                container.style.fontSize = '12pt';
                container.style.lineHeight = '1.6';
                
                // Content construction
                const title = document.createElement('h1');
                title.innerText = idea.title;
                title.style.fontSize = '24pt';
                title.style.marginBottom = '20px';
                title.style.color = '#333';
                title.style.borderBottom = '2px solid #333';
                title.style.paddingBottom = '10px';
                container.appendChild(title);
                
                const meta = document.createElement('p');
                meta.innerText = `Danh mục: ${CATEGORY_LABELS[idea.category]} | Ngày: ${formattedDate}`;
                meta.style.fontSize = '10pt';
                meta.style.color = '#666';
                meta.style.marginBottom = '30px';
                container.appendChild(meta);
                
                const contentDiv = document.createElement('div');
                
                if (idea.type === 'image') {
                    const img = document.createElement('img');
                    img.src = idea.content;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    contentDiv.appendChild(img);
                } else if (idea.type === 'outline') {
                    const outlineContent = idea.content as GeneratedOutline['content'];
                    
                    const mainTitle = document.createElement('h2');
                    mainTitle.innerText = outlineContent.title;
                    mainTitle.style.fontSize = '18pt';
                    mainTitle.style.marginBottom = '15px';
                    mainTitle.style.marginTop = '0';
                    mainTitle.style.color = '#2563eb';
                    contentDiv.appendChild(mainTitle);
                    
                    outlineContent.outline.forEach(section => {
                        const secTitle = document.createElement('h3');
                        secTitle.innerText = section.section;
                        secTitle.style.fontSize = '14pt';
                        secTitle.style.marginTop = '20px';
                        secTitle.style.marginBottom = '10px';
                        secTitle.style.fontWeight = 'bold';
                        secTitle.style.color = '#db2777';
                        contentDiv.appendChild(secTitle);
                        
                        const ul = document.createElement('ul');
                        ul.style.marginLeft = '20px';
                        ul.style.listStyleType = 'disc';
                        section.points.forEach(point => {
                            const li = document.createElement('li');
                            li.innerText = point;
                            li.style.marginBottom = '6px';
                            ul.appendChild(li);
                        });
                        contentDiv.appendChild(ul);
                    });
                } else {
                    // Text
                    const lines = (idea.content as string).split('\n');
                    lines.forEach(line => {
                         const p = document.createElement('p');
                         // Simple check for list items in plain text
                         if (line.trim().startsWith('- ')) {
                             p.innerText = line.trim();
                             p.style.paddingLeft = '20px';
                         } else {
                             p.innerText = line;
                         }
                         p.style.marginBottom = '10px';
                         contentDiv.appendChild(p);
                    });
                }
                container.appendChild(contentDiv);
                
                // Footer
                const footer = document.createElement('div');
                footer.innerText = 'Được tạo bởi Trợ Lý Sáng Tạo AI';
                footer.style.marginTop = '40px';
                footer.style.fontSize = '9pt';
                footer.style.color = '#999';
                footer.style.textAlign = 'center';
                footer.style.borderTop = '1px solid #eee';
                footer.style.paddingTop = '10px';
                container.appendChild(footer);

                document.body.appendChild(container);

                const canvas = await html2canvas(container, { 
                    scale: 2,
                    useCORS: true, // For images if needed
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / pdfWidth;
                const scaledHeight = imgHeight / ratio;

                let heightLeft = scaledHeight;
                let position = 0;
                let pageHeight = pdfHeight;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                  position = heightLeft - scaledHeight; // Negative position to move image up
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, - (scaledHeight - heightLeft - pageHeight), pdfWidth, scaledHeight);
                  heightLeft -= pageHeight;
                }

                pdf.save(filename);
                document.body.removeChild(container);
            } catch (error) {
                console.error("PDF generation error:", error);
                alert("Không thể tạo file PDF. Vui lòng thử lại.");
            } finally {
                setIsGeneratingPdf(false);
                setShowDownloadMenu(false);
            }
            return;
        }

        let content = '';
        let mimeType = '';

        if (format === 'png' && idea.type === 'image') {
            const link = document.createElement('a');
            link.href = idea.content;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowDownloadMenu(false);
            return;
        }

        if (format === 'json') {
            content = JSON.stringify(idea, null, 2);
            mimeType = 'application/json';
        } else if (format === 'md') {
            mimeType = 'text/markdown';
            if (idea.type === 'outline') {
                content = `# ${idea.content.title}\n\n${idea.content.outline.map(s => `## ${s.section}\n${s.points.map(p => `- ${p}`).join('\n')}`).join('\n\n')}`;
            } else if (idea.type === 'text') {
                content = `# ${idea.title}\n\n${idea.content}`;
            }
        } else if (format === 'txt') {
            mimeType = 'text/plain';
            if (idea.type === 'outline') {
                 content = `${idea.content.title}\n\n${idea.content.outline.map(s => `${s.section}\n${s.points.map(p => `- ${p}`).join('\n')}`).join('\n\n')}`;
            } else if (idea.type === 'text') {
                content = idea.content;
            }
        }

        if (content) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        setShowDownloadMenu(false);
    };

    const renderFullTextContent = (content: string) => {
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

    const renderFullOutlineContent = (content: GeneratedOutline['content']) => (
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

    return (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl shadow-lg p-4 w-full relative group">
            <div className="flex items-center justify-between mb-3">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') setIsEditingTitle(false);
                        }}
                        className="flex-grow p-1 bg-gray-900 border border-purple-500 rounded text-purple-300 font-semibold text-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                        aria-label="Sửa tiêu đề"
                        autoFocus
                    />
                ) : (
                    <h3 className="text-lg font-semibold text-purple-300 truncate pr-10" title={idea.title}>{idea.title}</h3>
                )}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    
                    <div className="relative" ref={downloadMenuRef}>
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="p-1 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                            title="Tải xuống"
                        >
                            <DownloadIcon className="w-4 h-4" />
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                                {idea.type === 'image' && (
                                     <button onClick={() => handleDownload('png')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Image (.png)</button>
                                )}
                                {(idea.type === 'text' || idea.type === 'outline') && (
                                    <>
                                        <button onClick={() => handleDownload('txt')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Text (.txt)</button>
                                        <button onClick={() => handleDownload('md')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">Markdown (.md)</button>
                                    </>
                                )}
                                <button onClick={() => handleDownload('json')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">JSON (.json)</button>
                                <button 
                                    onClick={() => handleDownload('pdf')} 
                                    disabled={isGeneratingPdf}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingPdf ? 'Đang tạo...' : 'PDF (.pdf)'}
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsViewingFull(true)}
                        className="p-1 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                        aria-label="Xem chi tiết"
                        title="Xem chi tiết"
                    >
                        <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                        aria-label="Sửa tiêu đề"
                        title="Sửa tiêu đề"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsMovingCategory(true)}
                        className="p-1 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                        aria-label="Chuyển danh mục"
                        title="Chuyển danh mục"
                    >
                        <FolderOpenIcon className="w-4 h-4" />
                    </button>
                    { (idea.type === 'text' || idea.type === 'outline') &&
                        <button
                            onClick={handleCopy}
                            className="p-1 bg-gray-700 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white transition-colors duration-200"
                            aria-label="Sao chép nội dung"
                            title="Sao chép"
                        >
                            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    }
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors duration-200"
                        aria-label="Xóa ý tưởng"
                        title="Xóa"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="text-gray-500 text-xs mb-3">
                Danh mục: <span className="text-purple-400 font-medium">{CATEGORY_LABELS[idea.category]}</span>
                <span className="ml-2"> | Tạo lúc: {formattedDate}</span>
            </p>

            {idea.type === 'image' ? (
                <img src={idea.content} alt={idea.title} className="rounded-lg w-full h-auto object-cover max-h-48 cursor-pointer" onClick={() => setIsViewingFull(true)} />
            ) : idea.type === 'outline' ? (
                <div onClick={() => setIsViewingFull(true)} className="cursor-pointer">
                    {renderOutlineContentPreview(idea.content)}
                </div>
            ) : (
                <div onClick={() => setIsViewingFull(true)} className="cursor-pointer">
                    {renderTextContentPreview(idea.content)}
                </div>
            )}

            {isViewingFull && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsViewingFull(false)}>
                    <div className="bg-gray-800 rounded-xl p-6 shadow-2xl w-full max-w-4xl border border-gray-700 max-h-[85vh] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsViewingFull(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2 pr-10">
                            {idea.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 border-b border-gray-700 pb-2">
                            {formattedDate} - {CATEGORY_LABELS[idea.category]}
                        </p>

                        <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
                            {idea.type === 'image' ? (
                                <img src={idea.content} alt={idea.title} className="rounded-lg w-full h-auto object-contain" />
                            ) : idea.type === 'outline' ? (
                                renderFullOutlineContent(idea.content)
                            ) : (
                                <div className="text-gray-200 space-y-2">
                                     {renderFullTextContent(idea.content)}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-700">
                             <div className="flex gap-2 mr-auto">
                                 {/* Unified Download button in full view could also be a dropdown or simple buttons, 
                                     but for now keeping simple individual buttons for text, maybe just add PDF button for all? */}
                                 {(idea.type === 'text' || idea.type === 'outline') ? (
                                    <>
                                        <button onClick={() => handleDownload('txt')} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">TXT</button>
                                        <button onClick={() => handleDownload('md')} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">MD</button>
                                        <button onClick={() => handleDownload('json')} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">JSON</button>
                                    </>
                                 ) : (
                                    <button onClick={() => handleDownload('png')} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium">PNG</button>
                                 )}
                                 <button 
                                    onClick={() => handleDownload('pdf')} 
                                    disabled={isGeneratingPdf}
                                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50"
                                 >
                                    {isGeneratingPdf ? 'Đang tạo PDF...' : 'PDF'}
                                 </button>
                             </div>
                             
                             <div className="flex gap-2">
                                { (idea.type === 'text' || idea.type === 'outline') &&
                                    <button
                                        onClick={handleCopy}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                        {copied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                }
                                <button
                                    onClick={() => setIsViewingFull(false)}
                                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Đóng
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {isMovingCategory && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm border border-gray-700">
                        <h4 className="text-xl font-bold text-white mb-4">Chuyển Danh Mục</h4>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as IdeaCategory)}
                            className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Chọn danh mục mới"
                        >
                            {Object.keys(CATEGORY_LABELS).map((cat) => (
                                <option key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat as IdeaCategory]}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setIsMovingCategory(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm border border-gray-700">
                        <h4 className="text-xl font-bold text-white mb-4">Xác nhận Xóa</h4>
                        <p className="text-gray-300 mb-6">Bạn có chắc chắn muốn xóa ý tưởng "<span className="font-semibold text-purple-400">{idea.title}</span>" không? Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedIdeaCard;