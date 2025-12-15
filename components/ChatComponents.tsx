import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../types';
import { Smile, Paperclip, Send, MoreHorizontal, FileText, Download, BarChart2, MessageSquare, CornerDownRight, Edit2, Trash2, X, Check, Plus, Bold, Italic, Strikethrough, Code, Link, User as UserIcon, Bookmark } from 'lucide-react';
import { CURRENT_USER_ID } from '../services/mockData';
import { db } from '../services/persistence';

interface MessageItemProps {
  message: Message;
  user?: User;
  isCurrentUser: boolean;
  onReaction: (emoji: string) => void;
  onVote?: (pollId: string, optionId: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onToggleSave?: (messageId: string) => void;
  isSaved?: boolean;
  isSequential?: boolean;
}

// Simple text formatter component
const FormattedText = ({ text }: { text: string }) => {
    // Regex based formatter for *bold*, _italic_, ~strike~, `code`
    // Note: This is a simplified parser and doesn't handle nested tags perfectly
    const parts = text.split(/(`[^`]+`|\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
    
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={i} className="bg-gray-100 dark:bg-gray-800 text-red-500 rounded px-1 py-0.5 text-[13px] font-mono">{part.slice(1, -1)}</code>;
                } else if (part.startsWith('*') && part.endsWith('*')) {
                    return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>;
                } else if (part.startsWith('_') && part.endsWith('_')) {
                    return <em key={i} className="italic">{part.slice(1, -1)}</em>;
                } else if (part.startsWith('~') && part.endsWith('~')) {
                    return <span key={i} className="line-through text-gray-500">{part.slice(1, -1)}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export const MessageItem: React.FC<MessageItemProps> = ({ 
    message, user, isCurrentUser, 
    onReaction, onVote, onReply, onEdit, onDelete, onToggleSave,
    isSaved = false,
    isSequential = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(ts));
  };

  const handleSaveEdit = () => {
      if (editContent.trim() !== message.content && onEdit) {
          onEdit(message.id, editContent);
      }
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setEditContent(message.content);
      setIsEditing(false);
  };

  const renderAttachments = () => {
    if (!message.attachments?.length) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {message.attachments.map((file, idx) => (
           <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-lg max-w-sm group cursor-pointer hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                 <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{file.name}</div>
                 <div className="text-xs text-gray-500">{file.size || '2MB'} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Download size={14} className="text-gray-600 dark:text-gray-300" />
              </div>
           </div>
        ))}
      </div>
    );
  };

  // Slack-style system message
  if (message.type === 'system') {
      return (
          <div className="flex items-center justify-center my-4">
              <div className="px-4 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 flex items-center gap-2">
                  <span>✨</span> {message.content}
              </div>
          </div>
      )
  }

  return (
    <div
      className={`group relative flex px-5 py-0.5 hover:bg-gray-50 dark:hover:bg-[#222529] transition-colors ${isSequential ? 'mt-0' : 'mt-2'} ${isEditing ? 'bg-blue-50 dark:bg-blue-900/10' : ''} ${isSaved ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Saved Indicator */}
      {isSaved && !isHovered && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>}

      {/* Gutter: Avatar or Time */}
      <div className="w-[42px] flex-shrink-0 mr-2 flex flex-col items-start">
         {!isSequential ? (
             <img 
                src={user?.avatar || 'https://via.placeholder.com/40'} 
                alt={user?.name} 
                className="w-9 h-9 rounded-md object-cover cursor-pointer hover:opacity-80" 
             />
         ) : (
             <span className="text-[10px] text-gray-400 w-9 text-right opacity-0 group-hover:opacity-100 mt-1.5 select-none">
                 {formatTime(message.timestamp).split(' ')[0]}
             </span>
         )}
      </div>

      <div className="flex-1 min-w-0 max-w-full">
         {/* Header: Name & Time (Only if not sequential) */}
         {!isSequential && (
             <div className="flex items-baseline gap-2 mb-0.5">
                 <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100 cursor-pointer hover:underline">
                     {user?.name || 'Unknown User'}
                 </span>
                 {message.isAiGenerated && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">APP</span>}
                 <span className="text-xs text-gray-500 hover:underline cursor-pointer">
                     {formatTime(message.timestamp)}
                 </span>
             </div>
         )}

         {/* Content Area */}
         <div className="text-[15px] leading-relaxed text-gray-900 dark:text-gray-200 break-words">
             {isEditing ? (
                 <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 mt-1">
                     <textarea 
                         value={editContent}
                         onChange={e => setEditContent(e.target.value)}
                         className="w-full bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-gray-100 min-h-[60px]"
                         autoFocus
                         onKeyDown={(e) => {
                             if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                             if(e.key === 'Escape') handleCancelEdit();
                         }}
                     />
                     <div className="flex justify-between items-center mt-2">
                         <span className="text-xs text-gray-400">Esc to cancel • Enter to save</span>
                         <div className="flex gap-2">
                             <button onClick={handleCancelEdit} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancel</button>
                             <button onClick={handleSaveEdit} className="px-3 py-1 text-sm bg-[#007a5a] text-white rounded hover:bg-[#148567]">Save Changes</button>
                         </div>
                     </div>
                 </div>
             ) : (
                <>
                    <FormattedText text={message.content} />
                    {message.editedAt && <span className="text-xs text-gray-400 ml-1 italic">(edited)</span>}
                </>
             )}
         </div>

         {renderAttachments()}

         {/* Reactions */}
         {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(message.reactions).map(([emoji, users]: [string, string[]]) => (
                <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${users.includes(CURRENT_USER_ID) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 text-blue-600 dark:text-blue-300' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700'}`}
                >
                    <span>{emoji}</span>
                    <span className="font-medium">{users.length}</span>
                </button>
                ))}
                <button 
                    onClick={() => onReaction('👍')} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full px-2 text-gray-500 text-xs flex items-center"
                    title="Add reaction"
                >
                    <Plus size={12} />
                </button>
            </div>
         )}

         {/* Reply Thread Teaser */}
         {(message.replyCount || 0) > 0 && (
             <div 
                 className="flex items-center gap-2 mt-1 cursor-pointer group/thread select-none" 
                 onClick={() => onReply && onReply(message.id)}
             >
                <div className="flex -space-x-1">
                   {[...Array(Math.min(3, message.replyCount!))].map((_, i) => (
                       <div key={i} className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-md border-2 border-white dark:border-nexus-900 flex items-center justify-center">
                           <UserIcon size={10} className="text-gray-500" />
                       </div>
                   ))}
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 group-hover/thread:underline">
                   {message.replyCount} replies
                </span>
                <span className="text-xs text-gray-400 group-hover/thread:opacity-100 opacity-0 transition-opacity">
                    Last reply today at {formatTime(Date.now())}
                </span>
             </div>
         )}
      </div>

      {/* Floating Toolbar */}
      {!isEditing && (
          <div className={`absolute -top-3 right-8 flex items-center bg-white dark:bg-[#1a1d21] border border-gray-200 dark:border-gray-700 rounded-md shadow-sm overflow-hidden z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => onReaction('👍')} title="Add reaction"><Smile size={16} /></button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => onReply && onReply(message.id)} title="Reply in thread"><MessageSquare size={16} /></button>
              <button className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isSaved ? 'text-red-500 fill-current' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`} onClick={() => onToggleSave && onToggleSave(message.id)} title={isSaved ? "Remove from saved items" : "Add to saved items"}><Bookmark size={16} fill={isSaved ? "currentColor" : "none"}/></button>
              
              {isCurrentUser && (
                  <>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setIsEditing(true)} title="Edit message"><Edit2 size={16} /></button>
                      <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600" onClick={() => onDelete && onDelete(message.id)} title="Delete message"><Trash2 size={16} /></button>
                  </>
              )}
          </div>
      )}
    </div>
  );
};

export const ThreadView = ({ 
    parentMessage, 
    replies, 
    users, 
    currentUser, 
    onClose, 
    onSendReply,
    onReaction,
    onEdit,
    onDelete
}: { 
    parentMessage: Message, 
    replies: Message[], 
    users: Record<string, User>, 
    currentUser: User,
    onClose: () => void, 
    onSendReply: (text: string) => void,
    onReaction: (msgId: string, emoji: string) => void,
    onEdit: (id: string, text: string) => void,
    onDelete: (id: string) => void
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies.length]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1d21]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Thread</h3>
                    <span className="text-xs text-gray-500">#{parentMessage.channelId}</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <div className="px-0 py-4">
                    <MessageItem 
                        message={parentMessage} 
                        user={users[parentMessage.userId]} 
                        isCurrentUser={currentUser.id === parentMessage.userId}
                        onReaction={(emoji) => onReaction(parentMessage.id, emoji)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isSequential={false}
                    />
                </div>
                
                <div className="relative flex items-center py-2 px-5">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">{replies.length} replies</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                <div className="pb-4">
                    {replies.map((msg, idx) => {
                         const prevMsg = replies[idx - 1];
                         const isSequential = prevMsg && prevMsg.userId === msg.userId && (msg.timestamp - prevMsg.timestamp < 300000); // 5 mins
                         return (
                            <MessageItem 
                                key={msg.id}
                                message={msg} 
                                user={users[msg.userId]} 
                                isCurrentUser={currentUser.id === msg.userId}
                                onReaction={(emoji) => onReaction(msg.id, emoji)}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                isSequential={isSequential}
                            />
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <ChatInput onSend={onSendReply} placeholder="Reply..." />
            </div>
        </div>
    );
};

export const ChatInput = ({ 
  onSend, 
  onAttach,
  onRequestPoll,
  disabled,
  placeholder = "Message...",
  channelId
}: { 
  onSend: (text: string) => void, 
  onAttach?: (file: File) => void,
  onRequestPoll?: () => void,
  disabled?: boolean,
  placeholder?: string,
  channelId?: string
}) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load draft on mount or channel change
  useEffect(() => {
      if (channelId) {
          const draft = db.getDraft(channelId);
          setText(draft);
      }
  }, [channelId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setText(newVal);
      if (channelId) {
          db.saveDraft(channelId, newVal);
      }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
    if (channelId) db.saveDraft(channelId, '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onAttach) {
      onAttach(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      <div className="border border-gray-400 dark:border-gray-600 rounded-xl bg-white dark:bg-[#222529] focus-within:ring-1 focus-within:ring-gray-400 focus-within:border-gray-400 transition-all shadow-sm overflow-hidden">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-[#222529] border-b border-transparent">
           <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Bold"><Bold size={14} /></button>
           <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Italic"><Italic size={14} /></button>
           <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Strikethrough"><Strikethrough size={14} /></button>
           <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
           <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Link"><Link size={14} /></button>
           <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Code"><Code size={14} /></button>
        </div>

        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full max-h-60 min-h-[44px] px-3 py-2 bg-transparent border-none focus:ring-0 resize-none text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 font-normal leading-normal"
        />

        {/* Bottom Toolbar */}
        <div className="flex justify-between items-center p-1.5">
           <div className="flex gap-1">
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
             <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Attach file">
                 <Plus size={16} />
             </button>
             <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Emoji">
                 <Smile size={16} />
             </button>
             <button className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Mention">
                 <span className="font-bold text-sm">@</span>
             </button>
             {onRequestPoll && (
                <button onClick={onRequestPoll} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Create Poll">
                    <BarChart2 size={16} />
                </button>
             )}
           </div>
           
           <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className={`p-2 rounded transition-colors flex items-center justify-center ${text.trim() ? 'bg-[#007a5a] text-white hover:bg-[#148567]' : 'bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
           >
             <Send size={16} className={text.trim() ? "ml-0.5" : ""} />
           </button>
        </div>
      </div>
    </div>
  );
};