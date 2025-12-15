import React, { useState, useEffect, useRef } from 'react';
import { X, Hash, Lock, Plus, ListChecks, User as UserIcon, LogOut, Check, Search, Briefcase, Command, MessageSquare, ArrowRight } from 'lucide-react';
import { User, Message, SearchResult } from '../types';
import { SettingsView } from './SettingsView';
import { db } from '../services/persistence';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[90vw] h-[80vh]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className={`bg-white dark:bg-[#1e2124] rounded-lg shadow-xl w-full ${sizeClasses[size]} relative z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}>
        {title && (
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={20} />
            </button>
            </div>
        )}
        <div className={title ? "p-5 overflow-y-auto" : "h-full"}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* --- Existing Modals (Channel, Poll, DM, Profile) --- */

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: 'public' | 'private', description: string) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.toLowerCase().replace(/\s+/g, '-'), isPrivate ? 'private' : 'public', description);
    setName('');
    setDescription('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel Name</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              {isPrivate ? <Lock size={16} /> : <Hash size={16} />}
            </span>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. plan-budget"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Names must be lowercase, without spaces.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
          <input 
            type="text" 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="private-toggle"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="private-toggle" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">Make private</label>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">Cancel</button>
          <button type="submit" disabled={!name} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Channel</button>
        </div>
      </form>
    </Modal>
  );
};

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    onCreate(question, validOptions);
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
          <input 
            type="text" 
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask something..."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                type="text" 
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white text-sm"
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 mt-1">
            <Plus size={14} /> Add another option
          </button>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">Cancel</button>
          <button type="submit" disabled={!question || options.filter(o => o.trim()).length < 2} className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Poll</button>
        </div>
      </form>
    </Modal>
  );
};

/* --- QUICK SWITCHER (Command Palette) --- */

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onNavigate: (type: 'channel' | 'user' | 'message', id: string, data?: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, workspaceId, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const hits = db.searchEverything(query, workspaceId);
        setResults(hits);
        setSelectedIndex(0);
    }, [query, workspaceId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSelect = (item: SearchResult) => {
        onNavigate(item.type, item.id, item.data);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-0 flex flex-col h-[500px]">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 bg-white dark:bg-[#1e2124]">
                    <Search className="text-gray-400" size={20} />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Jump to..."
                        className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                        autoComplete="off"
                    />
                    <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800">
                        <span className="font-sans">ESC</span> <span>to close</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {query.length === 0 && (
                         <div className="text-center text-gray-500 mt-20">
                            <p className="text-sm">Search for channels, people, or messages</p>
                            <div className="flex justify-center gap-2 mt-4 text-xs">
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500"># general</span>
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">Sarah</span>
                            </div>
                         </div>
                    )}
                    {query.length > 0 && results.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}
                    {results.map((item, idx) => (
                        <div 
                            key={`${item.type}-${item.id}`} 
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer group ${idx === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                        >
                            <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${idx === selectedIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
                                {item.type === 'channel' ? <Hash size={16} /> : 
                                 item.type === 'user' ? (item.icon ? <img src={item.icon} className="w-8 h-8 rounded" /> : <UserIcon size={16} />) : 
                                 <MessageSquare size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`flex justify-between items-center ${idx === selectedIndex ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                    <span className="font-bold text-sm truncate">{item.title}</span>
                                    {item.type === 'message' && <span className={`text-xs ${idx === selectedIndex ? 'text-blue-200' : 'text-gray-400'}`}>Message</span>}
                                    {item.type === 'channel' && <span className={`text-xs ${idx === selectedIndex ? 'text-blue-200' : 'text-gray-400'}`}>Channel</span>}
                                </div>
                                {item.subtitle && (
                                    <div className={`text-xs truncate ${idx === selectedIndex ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {item.subtitle}
                                    </div>
                                )}
                            </div>
                            {idx === selectedIndex && <ArrowRight size={16} className="text-white" />}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) onCreate(name);
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Workspace">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workspace Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                    autoFocus
                />
            </div>
            <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">Cancel</button>
                <button type="submit" disabled={!name} className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Create Workspace</button>
            </div>
        </form>
    </Modal>
  );
};

export const GeneralSettingsModal = ({ isOpen, onClose, user, onUpdateUser }: any) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" title={undefined}>
            <div className="h-full">
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-300 text-gray-600 dark:text-gray-200"><X size={16}/></button>
                </div>
                <SettingsView user={user} onUpdateUser={onUpdateUser} onClose={onClose} />
            </div>
        </Modal>
    )
}

interface CreateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export const CreateDMModal: React.FC<CreateDMModalProps> = ({ isOpen, onClose, users, currentUserId, onSelectUser }) => {
  const [search, setSearch] = useState('');
  
  const filteredUsers = users.filter(u => 
    u.id !== currentUserId && 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Message">
      <div className="mb-4">
        <input 
          type="text" 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search people..."
          className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2b2f36] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
          autoFocus
        />
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {filteredUsers.map(u => (
          <div 
            key={u.id} 
            onClick={() => { onSelectUser(u.id); onClose(); }}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
          >
            <img src={u.avatar} className="w-8 h-8 rounded-md" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</div>
              <div className="text-xs text-gray-500">{u.email}</div>
            </div>
            <span className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">No users found</div>
        )}
      </div>
    </Modal>
  );
};