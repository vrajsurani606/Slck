import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Search, Bell, HelpCircle, 
  MessageSquare, Users, Settings, Plus, 
  Video, Mic, Phone, CheckSquare, BarChart2, 
  Menu, X, ChevronDown, Lock, Info, Mail, Phone as PhoneIcon, Clock,
  AtSign, FileText, Bookmark, ChevronRight, UserPlus, Edit3, ShieldAlert
} from 'lucide-react';
import { MessageItem, ChatInput, ThreadView } from './components/ChatComponents';
import { TaskBoard, VideoCallOverlay, FileBrowser } from './components/FeatureComponents';
import { CreateChannelModal, CreatePollModal, GeneralSettingsModal, CreateDMModal, CreateWorkspaceModal, SearchModal } from './components/Modals';
import { AdminPanel } from './components/AdminPanel'; // Import Admin Panel
import { Auth } from './components/Auth';
import { auth } from './services/auth';
import { generateAIResponse } from './services/geminiService';
import { db } from './services/persistence';
import { adminService } from './services/admin';
import { User, Channel, Message, Task, Workspace, RightPanelType } from './types';

// Utility for ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

// Sidebar Section Component
const SidebarSection = ({ 
    title, 
    children, 
    onAdd,
    defaultExpanded = true 
}: { 
    title: string, 
    children?: React.ReactNode, 
    onAdd?: () => void,
    defaultExpanded?: boolean 
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <div className="mb-4">
            <div className="px-4 flex items-center justify-between group mb-1 text-gray-400 hover:text-gray-200 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-1">
                    <button className="p-0.5 rounded hover:bg-white/10">
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <h2 className="text-[13px] font-medium">{title}</h2>
                </div>
                {onAdd && (
                    <Plus 
                        size={14} 
                        className="opacity-0 group-hover:opacity-100 cursor-pointer hover:bg-white/10 rounded" 
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    />
                )}
            </div>
            {expanded && <div>{children}</div>}
        </div>
    );
};

export default function App() {
  /* --- STATE --- */
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('w1');
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  
  // Data State
  const [users, setUsers] = useState<Record<string, User>>({});
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentions, setMentions] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [savedMessages, setSavedMessages] = useState<Message[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'files' | 'mentions' | 'saved'>('chat');
  const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
  const [rightPanelData, setRightPanelData] = useState<any>(null); 
  
  const [isInCall, setIsInCall] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<null | 'create-channel' | 'create-poll' | 'settings' | 'create-dm' | 'create-workspace' | 'search'>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize App on Load (Session Check)
  useEffect(() => {
    const sessionUser = auth.restoreSession();
    if (sessionUser) {
      initializeData(sessionUser);
    }
    setLoadingSession(false);
  }, []);

  // Sync drafts and saved messages
  useEffect(() => {
      const interval = setInterval(() => {
          setDrafts(db.getAllDrafts());
          if (currentUser) {
              setSavedMessages(db.getSavedMessages(currentUser.id));
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [currentUser]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setActiveModal('search');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initializeData = (user: User) => {
    setCurrentUser(user);
    const allUsers = db.getAllUsers();
    setUsers(allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}));
    
    // Load Workspaces
    const allWorkspaces = db.getWorkspaces();
    setWorkspaces(allWorkspaces);
    if (allWorkspaces.length > 0) setActiveWorkspaceId(allWorkspaces[0].id);

    setSavedMessages(db.getSavedMessages(user.id));
    setDrafts(db.getAllDrafts());
    
    // Apply theme preference
    const html = document.querySelector('html');
    if (user.preferences?.theme === 'dark') html?.classList.add('dark');
    else if (user.preferences?.theme === 'light') html?.classList.remove('dark');
  };

  const loadWorkspaceData = (workspaceId: string) => {
    if (!currentUser) return;
    const userChannels = db.getChannels(currentUser.id, workspaceId);
    setChannels(userChannels);
    
    if (userChannels.length > 0) {
      setActiveChannelId(userChannels[0].id);
    } else {
        setActiveChannelId('');
        setMessages([]);
    }
    setMentions(db.getMentions(currentUser.id, workspaceId));
  };

  useEffect(() => {
    if (activeWorkspaceId) {
        loadWorkspaceData(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeChannelId && activeTab === 'chat') {
      setMessages(db.getMessages(activeChannelId));
      setTasks(db.getTasks(activeChannelId));
    }
  }, [activeChannelId, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeChannelId, activeTab]);

  /* --- LOGIC HANDLERS --- */
  
  const handleSendMessage = async (text: string, threadId?: string) => {
    if (!currentUser) return;
    
    if (text.includes('<script>') || text.includes('javascript:')) {
        alert("Security Alert: Malicious content detected and blocked.");
        return;
    }

    const newMessage: Message = {
      id: generateId(),
      channelId: activeChannelId,
      userId: currentUser.id,
      content: text,
      timestamp: Date.now(),
      type: 'text',
      threadId: threadId
    };
    
    db.saveMessage(newMessage);

    if (threadId) {
        setMessages(db.getMessages(activeChannelId));
    } else {
        setMessages(prev => [...prev, newMessage]);
    }

    if (!threadId) {
        const channel = channels.find(c => c.id === activeChannelId);
        if (!channel) return;

        const isAiDm = channel.type === 'dm' && channel.members.includes('u4') && channel.members.includes(currentUser.id);
        const isAiMention = text.includes('@Nexus AI') || text.includes('@AI');

        if (isAiDm || isAiMention) {
            setIsTyping('Nexus AI');
            const context = isAiDm 
            ? `You are chatting directly with ${currentUser.name}.` 
            : `User ${currentUser.name} asked in channel #${channel.name}.`;
            
            const cleanText = text.replace('@Nexus AI', '').replace('@AI', '');
            const reply = await generateAIResponse(cleanText, context);
            
            const aiMsg: Message = {
                id: generateId(),
                channelId: activeChannelId,
                userId: 'u4',
                content: reply,
                timestamp: Date.now(),
                type: 'text',
                isAiGenerated: true
            };
            db.saveMessage(aiMsg);
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(null);
        }
    }
  };

  const handleEditMessage = (id: string, newContent: string) => {
      const updated = db.editMessageContent(id, newContent);
      if (updated) {
        setMessages(prev => prev.map(m => m.id === id ? updated : m));
      }
  };

  const handleDeleteMessage = (id: string) => {
      if (confirm("Are you sure you want to delete this message?")) {
        db.deleteMessage(id);
        setMessages(prev => prev.filter(m => m.id !== id));
      }
  };

  const handleToggleSave = (messageId: string) => {
      if (!currentUser) return;
      const updatedUser = db.toggleSavedMessage(currentUser.id, messageId);
      setCurrentUser(updatedUser);
      setSavedMessages(db.getSavedMessages(currentUser.id));
  };

  const handleCreateChannel = (name: string, type: 'public' | 'private', description: string) => {
    if (!currentUser) return;
    const newChannel = db.createChannel(name, type, description, currentUser.id, activeWorkspaceId);
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
  };

  const handleCreateDM = (targetUserId: string) => {
    if (!currentUser) return;
    const newDM = db.createDM(currentUser.id, targetUserId, activeWorkspaceId);
    if (!channels.find(c => c.id === newDM.id)) {
      setChannels(prev => [...prev, newDM]);
    }
    setActiveChannelId(newDM.id);
    setActiveTab('chat');
  };

  const handleCreateWorkspace = (name: string) => {
      if (!currentUser) return;
      const newWs = db.createWorkspace(name, currentUser.id);
      setWorkspaces(prev => [...prev, newWs]);
      setActiveWorkspaceId(newWs.id);
  };

  const handleCreatePoll = (question: string, options: string[]) => {
    if (!currentUser) return;
    const pollMessage: Message = {
      id: generateId(),
      channelId: activeChannelId,
      userId: currentUser.id,
      content: 'Poll',
      timestamp: Date.now(),
      type: 'poll',
      poll: {
        question,
        allowMultiple: false,
        options: options.map(opt => ({ id: generateId(), text: opt, votes: [] }))
      }
    };
    db.saveMessage(pollMessage);
    setMessages(prev => [...prev, pollMessage]);
  };

  const handleVote = (messageId: string, optionId: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.poll) return;

    const newOptions = msg.poll.options.map(opt => {
      const hasVoted = opt.votes.includes(currentUser.id);
      if (opt.id === optionId) {
        return { ...opt, votes: hasVoted ? opt.votes.filter(uid => uid !== currentUser!.id) : [...opt.votes, currentUser!.id] };
      } else if (!msg.poll?.allowMultiple) {
        return { ...opt, votes: opt.votes.filter(uid => uid !== currentUser!.id) };
      }
      return opt;
    });

    const updatedMsg = { ...msg, poll: { ...msg.poll, options: newOptions } };
    db.updateMessage(updatedMsg);
    setMessages(prev => prev.map(m => m.id === messageId ? updatedMsg : m));
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === messageId) || db.getMessage(messageId); 
    if (!msg) return;

    const currentReactions = msg.reactions || {};
    const userList = currentReactions[emoji] || [];
    const hasReacted = userList.includes(currentUser.id);
    
    let newReactions = { ...currentReactions };
    if (hasReacted) {
      newReactions[emoji] = userList.filter(uid => uid !== currentUser!.id);
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
      newReactions[emoji] = [...userList, currentUser.id];
    }

    const updatedMsg = { ...msg, reactions: newReactions };
    db.updateMessage(updatedMsg);
    
    if (!msg.threadId) {
        setMessages(prev => prev.map(m => m.id === messageId ? updatedMsg : m));
    }
  };

  const handleAddTask = (status: Task['status']) => {
      if (!currentUser) return;
      const title = prompt("Enter task title:");
      if (!title) return;
      const newTask: Task = {
          id: generateId(),
          channelId: activeChannelId,
          title,
          status,
          assigneeId: currentUser.id,
          dueDate: Date.now() + 86400000 * 3
      };
      db.addTask(newTask);
      setTasks(prev => [...prev, newTask]);
  };

  const handleMoveTask = (taskId: string, newStatus: Task['status']) => {
      db.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleUpdateUser = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      setUsers(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setActiveModal(null);
  };
  
  const handleJoinChannel = () => {
      if (!currentUser || !activeChannelId) return;
      db.joinChannel(activeChannelId, currentUser.id);
      const updatedChannels = db.getChannels(currentUser.id, activeWorkspaceId);
      setChannels(updatedChannels);
  };
  
  const handleLeaveChannel = () => {
      if (!currentUser || !activeChannelId) return;
      db.leaveChannel(activeChannelId, currentUser.id);
      const updatedChannels = db.getChannels(currentUser.id, activeWorkspaceId);
      setChannels(updatedChannels);
      if(updatedChannels.length > 0) setActiveChannelId(updatedChannels[0].id);
  };
  
  const handleSearchNavigate = (type: 'channel' | 'user' | 'message', id: string, data: any) => {
      if (type === 'channel') {
          setActiveChannelId(id);
          setActiveTab('chat');
      } else if (type === 'user') {
          handleCreateDM(id);
      } else if (type === 'message') {
          if (data && data.channel) {
              setActiveChannelId(data.channel.id);
              setActiveTab('chat');
          }
      }
  };

  const openProfile = (userId: string) => {
      setRightPanelData(userId);
      setRightPanel('profile');
  };

  const openThread = (messageId: string) => {
      setRightPanelData(messageId);
      setRightPanel('thread');
  };

  const handleFileUpload = (file: File) => {
      if (!currentUser) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
          alert('Security Alert: Unsupported file type blocked.');
          return;
      }
      if (file.size > 5 * 1024 * 1024) {
          alert('File too large.');
          return;
      }
      const isMalware = file.name.toLowerCase().includes('virus');
      if (isMalware) {
          alert('Security Alert: Malware detected in file. Upload blocked.');
          return;
      }

      const fileMessage: Message = {
        id: generateId(),
        channelId: activeChannelId,
        userId: currentUser.id,
        content: `Uploaded ${file.name}`,
        timestamp: Date.now(),
        type: 'file',
        attachments: [{
            type: file.type,
            name: file.name,
            url: URL.createObjectURL(file),
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        }]
      };
      db.saveMessage(fileMessage);
      setMessages(prev => [...prev, fileMessage]);
  };

  // --- RENDER ---

  if (loadingSession) {
      return (
          <div className="h-screen w-screen bg-white dark:bg-[#1a1d21] flex items-center justify-center">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#4A154B] rounded-lg animate-bounce flex items-center justify-center mb-4">
                      <span className="text-white font-bold text-xl">N</span>
                  </div>
                  <p className="text-gray-500 font-medium animate-pulse">Initializing Nexus...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Auth onLogin={initializeData} />;
  }

  // Admin Panel Render Intercept
  if (showAdminPanel && currentUser && adminService.isAdmin(currentUser)) {
      return <AdminPanel currentUser={currentUser} onClose={() => setShowAdminPanel(false)} />;
  }

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="flex h-screen bg-white dark:bg-nexus-900 overflow-hidden font-sans">
      
      {/* 1. WORKSPACE SWITCHER */}
      <div className="w-[70px] bg-nexus-900 flex flex-col items-center py-4 space-y-4 z-20 flex-shrink-0 border-r border-white/10">
        {workspaces.map(ws => (
            <div 
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 group relative
                    ${activeWorkspaceId === ws.id ? 'bg-white text-nexus-900' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
                <span className="font-bold text-sm">{ws.icon}</span>
                <div className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    {ws.name}
                </div>
            </div>
        ))}
        <div 
            onClick={() => setActiveModal('create-workspace')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-green-400 cursor-pointer transition-colors"
        >
            <Plus size={20} />
        </div>
      </div>

      {/* 2. SIDEBAR (CHANNELS) */}
      <div className={`${sidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} bg-nexus-800 flex flex-col transition-all duration-300 flex-shrink-0 z-10 relative`}>
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 hover:bg-white/5 transition-colors cursor-pointer group">
            <h1 className="text-white font-bold text-[15px] truncate rounded w-full flex items-center justify-between">
                {workspaces.find(w => w.id === activeWorkspaceId)?.name} <ChevronDown size={14} />
            </h1>
            <div className="w-8 h-8 rounded-full bg-white text-nexus-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings size={14} />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {/* Top Stats */}
            <div className="mb-4 px-2 space-y-0.5">
                 <div onClick={() => setActiveTab('mentions')} className={`flex items-center gap-3 px-3 py-1.5 rounded cursor-pointer ${activeTab === 'mentions' ? 'bg-[#1164A3] text-white' : 'text-[#bdbdbd] hover:bg-white/10'}`}>
                    <AtSign size={16} /> 
                    <span className="text-[15px]">Mentions & reactions</span>
                 </div>
                 <div className="flex items-center gap-3 px-3 py-1.5 rounded cursor-pointer text-[#bdbdbd] hover:bg-white/10">
                    <MessageSquare size={16} /> 
                    <span className="text-[15px]">Threads</span>
                 </div>
                 <div onClick={() => setActiveTab('saved')} className={`flex items-center gap-3 px-3 py-1.5 rounded cursor-pointer ${activeTab === 'saved' ? 'bg-[#1164A3] text-white' : 'text-[#bdbdbd] hover:bg-white/10'}`}>
                    <Bookmark size={16} /> 
                    <span className="text-[15px]">Saved items</span>
                 </div>
                 {/* Admin Panel Button */}
                 {currentUser && adminService.isAdmin(currentUser) && (
                     <div onClick={() => setShowAdminPanel(true)} className="flex items-center gap-3 px-3 py-1.5 rounded cursor-pointer text-red-400 hover:bg-white/10 mt-2">
                        <ShieldAlert size={16} /> 
                        <span className="text-[15px]">Admin Console</span>
                     </div>
                 )}
            </div>

            <div className="px-4 border-t border-white/10 my-4"></div>

            {/* Channels */}
            <SidebarSection title="Channels" onAdd={() => setActiveModal('create-channel')}>
                <ul>
                    {channels.filter(c => c.type !== 'dm').map(c => (
                        <li 
                            key={c.id} 
                            onClick={() => { setActiveChannelId(c.id); setActiveTab('chat'); setRightPanel(null); }}
                            className={`px-4 py-1.5 cursor-pointer flex items-center justify-between group ${activeChannelId === c.id && activeTab !== 'mentions' && activeTab !== 'saved' ? 'bg-[#1164A3] text-white' : 'text-[#bdbdbd] hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {c.type === 'private' ? <Lock size={13} className="opacity-70" /> : <Hash size={15} className="opacity-70" />}
                                <span className={`${c.unreadCount ? 'font-bold text-white' : ''} text-[15px]`}>{c.name}</span>
                            </div>
                            {drafts[c.id] && (
                                <Edit3 size={12} className="text-white opacity-70" />
                            )}
                        </li>
                    ))}
                </ul>
            </SidebarSection>

            <SidebarSection title="Direct messages" onAdd={() => setActiveModal('create-dm')}>
                <ul>
                    {channels.filter(c => c.type === 'dm').map(c => {
                         const otherUserId = c.members.find(m => m !== currentUser.id);
                         const otherUser = otherUserId ? users[otherUserId] : null;
                         const isOnline = otherUser?.status === 'online';
                         const displayName = otherUser ? otherUser.name : c.name;
                         
                         return (
                            <li 
                                key={c.id} 
                                onClick={() => { setActiveChannelId(c.id); setActiveTab('chat'); setRightPanel(null); }}
                                className={`px-4 py-1.5 cursor-pointer flex items-center justify-between ${activeChannelId === c.id && activeTab !== 'mentions' && activeTab !== 'saved' ? 'bg-[#1164A3] text-white' : 'text-[#bdbdbd] hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <div className="relative flex-shrink-0">
                                        <img src={otherUser?.avatar || 'https://via.placeholder.com/20'} className="w-4 h-4 rounded text-[8px]" />
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-nexus-800 ${isOnline ? 'bg-green-500' : 'bg-transparent border-gray-400'}`}></span>
                                    </div>
                                    <span className={`truncate text-[15px] ${otherUserId === 'u4' ? 'text-purple-300' : ''}`}>{displayName}</span>
                                    {otherUser?.statusEmoji && <span className="text-xs grayscale">{otherUser.statusEmoji}</span>}
                                </div>
                                {drafts[c.id] && (
                                    <Edit3 size={12} className="text-white opacity-70" />
                                )}
                            </li>
                         );
                    })}
                </ul>
            </SidebarSection>
        </div>

        {/* User Status Footer */}
        <div className="h-14 bg-[#1a1d21] flex items-center px-4 gap-3 border-t border-gray-700/50">
             <div className="relative group cursor-pointer" onClick={() => setActiveModal('settings')}>
                 <img src={currentUser.avatar} className="w-9 h-9 rounded-md hover:opacity-80 transition-opacity" />
                 <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-[#1a1d21] rounded-full ${currentUser.status === 'online' ? 'bg-green-500' : currentUser.status === 'busy' ? 'bg-red-500' : currentUser.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
             </div>
             <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveModal('settings')}>
                 <div className="text-sm font-bold text-white truncate hover:underline">{currentUser.name}</div>
                 <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                     {currentUser.statusEmoji && <span>{currentUser.statusEmoji}</span>}
                     {currentUser.statusText || currentUser.status}
                 </div>
             </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex min-w-0 bg-white dark:bg-gray-900 relative">
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            {activeTab === 'mentions' || activeTab === 'saved' ? (
                <header className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-[#1a1d21] flex-shrink-0">
                     <div className="flex items-center gap-3">
                         <button className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${sidebarOpen ? 'hidden md:hidden' : 'block'}`} onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="font-bold text-gray-900 dark:text-gray-100">{activeTab === 'mentions' ? 'Mentions & Reactions' : 'Saved Items'}</h2>
                     </div>
                </header>
            ) : activeChannel ? (
                <header className="h-12 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-[#1a1d21] flex-shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <button className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${sidebarOpen ? 'hidden md:hidden' : 'block'}`} onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors" onClick={() => setRightPanel(rightPanel === 'directory' ? null : 'directory')}>
                            {activeChannel.type === 'dm' ? '@' : '#'}{activeChannel.type === 'dm' && activeChannel.members.includes('u4') ? 'Nexus AI' : activeChannel.name}
                            <ChevronDown size={12} className="text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-500">
                        <div className="flex items-center -space-x-1 cursor-pointer hover:opacity-80" onClick={() => { setRightPanel('directory'); }}>
                            {activeChannel.members.slice(0, 3).map(mid => users[mid] ? (
                                <img key={mid} src={users[mid].avatar} className="w-6 h-6 rounded-md border-2 border-white dark:border-[#1a1d21]" title={users[mid].name} />
                            ) : null)}
                            <span className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] border-2 border-white dark:border-[#1a1d21] font-bold text-gray-600 dark:text-gray-300">{activeChannel.members.length}</span>
                        </div>
                    </div>
                </header>
            ) : null }

            <main className="flex-1 overflow-hidden relative flex flex-col">
                {activeTab === 'saved' && (
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#1e2124]">
                        <div className="flex items-center justify-between mb-4 px-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Saved items</h3>
                        </div>
                        {savedMessages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">
                                <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Save messages to access them quickly later.</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            {savedMessages.map(msg => (
                                <div key={msg.id} className="bg-white dark:bg-nexus-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:shadow-md transition-shadow">
                                    <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 mb-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-bold">#{channels.find(c => c.id === msg.channelId)?.name}</span>
                                            <span>•</span>
                                            <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <button onClick={() => handleToggleSave(msg.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <MessageItem 
                                        message={msg} 
                                        user={users[msg.userId]} 
                                        isCurrentUser={currentUser?.id === msg.userId}
                                        onReaction={(emoji) => handleReaction(msg.id, emoji)}
                                        onVote={handleVote} 
                                        onReply={openThread}
                                        onEdit={handleEditMessage}
                                        onDelete={handleDeleteMessage}
                                        onToggleSave={handleToggleSave}
                                        isSaved={true}
                                        isSequential={false}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'mentions' && (
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#1e2124]">
                        <h3 className="text-xl font-bold mb-4 px-4 text-gray-900 dark:text-white">Recent Mentions</h3>
                        {mentions.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">
                                <AtSign size={48} className="mx-auto mb-4 opacity-50" />
                                <p>You haven't been mentioned yet.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            {mentions.map(msg => (
                                <div key={msg.id} className="bg-white dark:bg-nexus-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                                    setActiveChannelId(msg.channelId);
                                    setActiveTab('chat');
                                }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <img src={users[msg.userId]?.avatar} className="w-6 h-6 rounded" />
                                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{users[msg.userId]?.name}</span>
                                            <span className="text-xs text-gray-500">in #{channels.find(c => c.id === msg.channelId)?.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && activeChannel && (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-0 py-0 space-y-0">
                            {/* Empty State / Welcome Message */}
                            <div className="mb-8 mt-8 px-5">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2b2f36] rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                                    {activeChannel.type === 'dm' ? <Users size={32} /> : <Hash size={32} />}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {activeChannel.type === 'dm' ? (
                                        <span>This is the beginning of your direct message history with <span className="text-blue-500">{activeChannel.name}</span></span>
                                    ) : (
                                        <span>Welcome to #{activeChannel.name}!</span>
                                    )}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {activeChannel.type === 'dm' ? `` : `This is the start of the #${activeChannel.name} channel. ${activeChannel.description || "Let's get to work!"}`}
                                </p>
                            </div>

                            {messages.map((msg, idx) => {
                                const prevMsg = messages[idx - 1];
                                const isSequential = prevMsg && prevMsg.userId === msg.userId && (msg.timestamp - prevMsg.timestamp < 300000) && msg.type !== 'system';
                                const showDateSeparator = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                                const isSaved = currentUser?.savedMessageIds?.includes(msg.id);
                                
                                return (
                                    <div key={msg.id}>
                                        {showDateSeparator && (
                                            <div className="relative flex items-center py-4 select-none">
                                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                                <button className="flex-shrink-0 mx-4 text-[13px] font-bold text-gray-800 dark:text-gray-300 bg-white dark:bg-[#1a1d21] px-4 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm cursor-default">
                                                    {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric'})}
                                                </button>
                                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                            </div>
                                        )}
                                        <div onClick={() => { if (msg.userId !== 'system' && msg.userId !== currentUser.id) openProfile(msg.userId); }}>
                                            <MessageItem 
                                                message={msg} 
                                                user={users[msg.userId]} 
                                                isCurrentUser={msg.userId === currentUser.id}
                                                onReaction={(emoji) => handleReaction(msg.id, emoji)}
                                                onVote={handleVote} 
                                                onReply={openThread}
                                                onEdit={handleEditMessage}
                                                onDelete={handleDeleteMessage}
                                                onToggleSave={handleToggleSave}
                                                isSaved={isSaved}
                                                isSequential={isSequential}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {isTyping && (
                                <div className="px-5 py-2 text-xs text-gray-500 animate-pulse italic">
                                    {isTyping} is typing...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="flex-shrink-0 px-5 pb-5 pt-2">
                            {/* If user is not member of public channel, show Join button */}
                            {activeChannel.type === 'public' && !activeChannel.members.includes(currentUser.id) ? (
                                <div className="flex flex-col items-center justify-center p-6 border-t border-gray-200 dark:border-gray-700">
                                    <p className="mb-3 text-gray-600 dark:text-gray-300">You are viewing <strong>#{activeChannel.name}</strong></p>
                                    <button onClick={handleJoinChannel} className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors">
                                        Join Channel
                                    </button>
                                </div>
                            ) : (
                                <ChatInput 
                                    onSend={handleSendMessage} 
                                    onAttach={handleFileUpload}
                                    onRequestPoll={() => setActiveModal('create-poll')}
                                    placeholder={`Message ${activeChannel.type === 'dm' ? '' : '#'}${activeChannel.name}`}
                                    channelId={activeChannel.id}
                                />
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'tasks' && (
                    <TaskBoard 
                        tasks={tasks}
                        users={users}
                        onAddTask={handleAddTask}
                        onMoveTask={handleMoveTask}
                    />
                )}

                {activeTab === 'files' && (
                    <FileBrowser 
                        messages={db.getMessages(activeChannelId).concat(db.getThreadMessages(activeChannelId))} // Hacky way to get all messages for files, ideally db has getChannelFiles
                        users={users}
                    />
                )}

                {!activeChannel && activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-[#1a1d21]">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#2b2f36] rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} />
                        </div>
                        <p className="text-lg font-medium text-gray-500">Welcome to Nexus</p>
                        <p className="text-sm">Select a channel to start collaborating</p>
                    </div>
                )}
            </main>
        </div>

        {/* 4. RIGHT SIDEBAR PANEL */}
        {rightPanel && (
            <div className="w-[350px] border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1d21] flex flex-col shadow-xl z-20">
                {rightPanel !== 'thread' && (
                    <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-gray-50 dark:bg-[#1a1d21]">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">
                            {rightPanel === 'profile' ? 'Profile' : 'Channel Details'}
                        </h3>
                        <button onClick={() => setRightPanel(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <X size={20} />
                        </button>
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto h-full">
                    {rightPanel === 'profile' && users[rightPanelData] && (
                        <div className="p-0">
                             <div className="h-24 bg-blue-100 dark:bg-blue-900/30"></div>
                             <div className="px-6 relative">
                                <img src={users[rightPanelData].avatar} className="w-24 h-24 rounded-lg border-4 border-white dark:border-[#1a1d21] absolute -top-12" />
                                <div className="mt-14 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{users[rightPanelData].name}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">{users[rightPanelData].bio || 'Team Member'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${users[rightPanelData].status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm text-gray-500 capitalize">{users[rightPanelData].status}</span>
                                        {users[rightPanelData].statusText && (
                                            <span className="text-sm text-gray-500 border-l border-gray-300 pl-2 ml-1">
                                                {users[rightPanelData].statusEmoji} {users[rightPanelData].statusText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid gap-3 mb-6">
                                    <button className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 dark:border-gray-600 rounded font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <MessageSquare size={16} /> Message
                                    </button>
                                    <div className="flex gap-3">
                                        <button className="flex-1 flex items-center justify-center py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <PhoneIcon size={16} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                        <button className="flex-1 flex items-center justify-center py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <Video size={16} className="text-gray-600 dark:text-gray-300" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-white dark:bg-[#222529] p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Contact</label>
                                        <div className="flex items-center gap-2 mt-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                            <Mail size={14} />
                                            <span className="text-sm">{users[rightPanelData].email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Local Time</label>
                                        <div className="flex items-center gap-2 mt-1 text-gray-900 dark:text-gray-300">
                                            <Clock size={14} /> 
                                            <span className="text-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {rightPanel === 'directory' && activeChannel && (
                        <div className="p-0">
                             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">About #{activeChannel.name}</h4>
                                    {activeChannel.type === 'public' && activeChannel.members.includes(currentUser.id) && (
                                        <button onClick={handleLeaveChannel} className="text-xs text-red-500 hover:underline">Leave</button>
                                    )}
                                </div>
                                <div className="bg-gray-100 dark:bg-[#222529] p-3 rounded text-sm text-gray-700 dark:text-gray-300">
                                    {activeChannel.description || 'No description provided.'}
                                </div>
                             </div>

                             <div className="p-4">
                                 <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{activeChannel.members.length} Members</h4>
                                    <Search size={16} className="text-gray-400" />
                                 </div>
                                 
                                 {/* Add People Fake Button */}
                                 <div className="flex items-center gap-3 p-2 mb-2 hover:bg-gray-100 dark:hover:bg-[#222529] rounded cursor-pointer text-gray-500 dark:text-gray-400">
                                     <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                         <UserPlus size={18} />
                                     </div>
                                     <span className="text-sm font-medium">Add people</span>
                                 </div>

                                 <div className="space-y-1">
                                    {activeChannel.members.map(mid => users[mid] ? (
                                        <div key={mid} onClick={() => { setRightPanelData(mid); setRightPanel('profile'); }} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-[#222529] rounded cursor-pointer transition-colors group">
                                            <img src={users[mid].avatar} className="w-9 h-9 rounded" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{users[mid].name}</div>
                                                <div className={`text-xs flex items-center gap-1 ${users[mid].status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${users[mid].status === 'online' ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                                                    {users[mid].status}
                                                </div>
                                            </div>
                                        </div>
                                    ) : null)}
                                 </div>
                             </div>
                        </div>
                    )}

                    {rightPanel === 'thread' && (
                        <ThreadView 
                            parentMessage={db.getMessage(rightPanelData)!}
                            replies={db.getThreadMessages(rightPanelData)}
                            users={users}
                            currentUser={currentUser}
                            onClose={() => setRightPanel(null)}
                            onSendReply={(text) => handleSendMessage(text, rightPanelData)}
                            onReaction={handleReaction}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                        />
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Video Call Overlay */}
      {isInCall && activeChannel && (
        <VideoCallOverlay channelName={activeChannel.name} onClose={() => setIsInCall(false)} />
      )}

      {/* Modals */}
      <CreateChannelModal 
        isOpen={activeModal === 'create-channel'}
        onClose={() => setActiveModal(null)}
        onCreate={handleCreateChannel}
      />
      <CreatePollModal
        isOpen={activeModal === 'create-poll'}
        onClose={() => setActiveModal(null)}
        onCreate={handleCreatePoll}
      />
      <CreateDMModal
        isOpen={activeModal === 'create-dm'}
        onClose={() => setActiveModal(null)}
        users={Object.values(users)}
        currentUserId={currentUser.id}
        onSelectUser={handleCreateDM}
      />
      <CreateWorkspaceModal 
        isOpen={activeModal === 'create-workspace'}
        onClose={() => setActiveModal(null)}
        onCreate={handleCreateWorkspace}
      />
      <GeneralSettingsModal 
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        user={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
      />
      <SearchModal
        isOpen={activeModal === 'search'}
        onClose={() => setActiveModal(null)}
        workspaceId={activeWorkspaceId}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
}