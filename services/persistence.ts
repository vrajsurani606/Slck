import { User, Channel, Message, Task, Workspace, SearchResult } from '../types';

// Initial Seed Data
const SEED_USERS: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@nexus.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'online', statusText: 'Focusing', statusEmoji: '🎧', role: 'owner', bio: 'Product Lead @ Nexus', savedMessageIds: [], preferences: { theme: 'system', notifications: true, sound: true } },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@nexus.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'busy', statusText: 'In a meeting', statusEmoji: '📅', role: 'admin', bio: 'Senior Engineer', savedMessageIds: [], preferences: { theme: 'dark', notifications: true, sound: false } },
  { id: 'u3', name: 'Mike Ross', email: 'mike@nexus.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', status: 'offline', role: 'member', bio: 'Marketing Guru', savedMessageIds: [], preferences: { theme: 'light', notifications: false, sound: true } },
  { id: 'u4', name: 'Nexus AI', email: 'ai@nexus.com', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexus', status: 'online', role: 'member', bio: 'I am your helpful AI assistant.', savedMessageIds: [] },
];

const SEED_WORKSPACES: Workspace[] = [
  { id: 'w1', name: 'Nexus Corp', icon: 'NC', ownerId: 'u1' },
];

const SEED_CHANNELS: Channel[] = [
  { id: 'c1', workspaceId: 'w1', name: 'general', type: 'public', description: 'Company-wide announcements', members: ['u1', 'u2', 'u3', 'u4'] },
  { id: 'c2', workspaceId: 'w1', name: 'engineering', type: 'public', description: 'Tech talk & git blame', members: ['u1', 'u2'] },
  { id: 'c3', workspaceId: 'w1', name: 'marketing', type: 'private', description: 'Top secret campaigns', members: ['u1', 'u3'] },
  { id: 'c4', workspaceId: 'w1', name: 'Sarah Chen', type: 'dm', members: ['u1', 'u2'] },
  { id: 'c5', workspaceId: 'w1', name: 'Nexus AI', type: 'dm', members: ['u1', 'u4'] },
];

// LocalStorage Keys
const KEYS = {
  USERS: 'nexus_users',
  CHANNELS: 'nexus_channels',
  MESSAGES: 'nexus_messages',
  TASKS: 'nexus_tasks',
  CURRENT_USER: 'nexus_current_user_id',
  WORKSPACES: 'nexus_workspaces',
  DRAFTS: 'nexus_drafts'
};

class PersistenceService {
  private users: Record<string, User>;
  private channels: Channel[];
  private messages: Message[];
  private tasks: Task[];
  private workspaces: Workspace[];
  private drafts: Record<string, string>; // channelId -> text

  constructor() {
    this.users = this.load(KEYS.USERS, this.arrayToRecord(SEED_USERS));
    this.channels = this.load(KEYS.CHANNELS, SEED_CHANNELS);
    this.messages = this.load(KEYS.MESSAGES, []);
    this.tasks = this.load(KEYS.TASKS, []);
    this.workspaces = this.load(KEYS.WORKSPACES, SEED_WORKSPACES);
    this.drafts = this.load(KEYS.DRAFTS, {});
  }

  private load<T>(key: string, fallback: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  }

  private save(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private arrayToRecord(users: User[]): Record<string, User> {
    return users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});
  }

  // --- Auth & Users ---
  
  login(email: string): User | null {
    const user = Object.values(this.users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, user.id);
      return user;
    }
    return null;
  }

  signup(name: string, email: string): User {
    const id = 'u' + Date.now();
    const newUser: User = {
      id,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      status: 'online',
      role: 'member',
      savedMessageIds: [],
      preferences: { theme: 'system', notifications: true, sound: true }
    };
    this.users[id] = newUser;
    this.save(KEYS.USERS, this.users);
    localStorage.setItem(KEYS.CURRENT_USER, id);
    
    // Auto-join public channels in default workspace
    this.channels = this.channels.map(c => 
      c.type === 'public' && c.workspaceId === 'w1' ? { ...c, members: [...c.members, id] } : c
    );
    this.save(KEYS.CHANNELS, this.channels);
    
    this.createDM(id, 'u4', 'w1'); // Connect to AI

    return newUser;
  }

  getCurrentUser(): User | null {
    const id = localStorage.getItem(KEYS.CURRENT_USER);
    return id ? this.users[id] : null;
  }

  logout() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  getAllUsers(): User[] {
    return Object.values(this.users);
  }

  updateUser(userId: string, updates: Partial<User>) {
    if (this.users[userId]) {
      this.users[userId] = { ...this.users[userId], ...updates };
      this.save(KEYS.USERS, this.users);
    }
    return this.users[userId];
  }

  // --- Saved Items (Bookmarks) ---

  toggleSavedMessage(userId: string, messageId: string): User {
      const user = this.users[userId];
      if (!user) return user;

      const saved = user.savedMessageIds || [];
      if (saved.includes(messageId)) {
          user.savedMessageIds = saved.filter(id => id !== messageId);
      } else {
          user.savedMessageIds = [...saved, messageId];
      }
      this.users[userId] = user;
      this.save(KEYS.USERS, this.users);
      return user;
  }

  getSavedMessages(userId: string): Message[] {
      const user = this.users[userId];
      if (!user || !user.savedMessageIds) return [];
      
      return user.savedMessageIds
        .map(id => this.messages.find(m => m.id === id))
        .filter((m): m is Message => !!m);
  }

  // --- Drafts ---

  saveDraft(channelId: string, text: string) {
      if (!text.trim()) {
          delete this.drafts[channelId];
      } else {
          this.drafts[channelId] = text;
      }
      this.save(KEYS.DRAFTS, this.drafts);
  }

  getDraft(channelId: string): string {
      return this.drafts[channelId] || '';
  }

  getAllDrafts(): Record<string, string> {
      return this.drafts;
  }

  // --- Workspaces ---

  getWorkspaces(): Workspace[] {
    return this.workspaces;
  }

  createWorkspace(name: string, ownerId: string): Workspace {
    const icon = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const newWs: Workspace = {
      id: 'w' + Date.now(),
      name,
      icon,
      ownerId
    };
    this.workspaces.push(newWs);
    this.save(KEYS.WORKSPACES, this.workspaces);

    // Create default 'general' channel for this workspace
    this.createChannel('general', 'public', 'General discussion', ownerId, newWs.id);

    return newWs;
  }

  // --- Channels ---

  getChannels(userId: string, workspaceId: string): Channel[] {
    // Return channels the user is a member of, OR public channels they could join
    return this.channels.filter(c => 
      c.workspaceId === workspaceId && (c.type === 'public' || c.members.includes(userId))
    );
  }

  // ADMIN: Get all channels raw
  getAllChannelsGlobal(): Channel[] {
      return this.channels;
  }
  
  joinChannel(channelId: string, userId: string): void {
      const channelIndex = this.channels.findIndex(c => c.id === channelId);
      if (channelIndex !== -1 && !this.channels[channelIndex].members.includes(userId)) {
          this.channels[channelIndex].members.push(userId);
          this.save(KEYS.CHANNELS, this.channels);
      }
  }

  leaveChannel(channelId: string, userId: string): void {
      const channelIndex = this.channels.findIndex(c => c.id === channelId);
      if (channelIndex !== -1) {
          this.channels[channelIndex].members = this.channels[channelIndex].members.filter(id => id !== userId);
          this.save(KEYS.CHANNELS, this.channels);
      }
  }

  createChannel(name: string, type: 'public' | 'private', description: string, creatorId: string, workspaceId: string): Channel {
    const newChannel: Channel = {
      id: 'c' + Date.now(),
      workspaceId,
      name,
      type,
      description,
      members: [creatorId],
      unreadCount: 0
    };
    this.channels.push(newChannel);
    this.save(KEYS.CHANNELS, this.channels);
    return newChannel;
  }

  createDM(userId1: string, userId2: string, workspaceId: string): Channel {
    const existing = this.channels.find(c => 
      c.type === 'dm' && c.members.includes(userId1) && c.members.includes(userId2)
    );
    if (existing) return existing;

    const user2 = this.users[userId2];
    const newDM: Channel = {
      id: 'dm_' + userId1 + '_' + userId2,
      workspaceId, 
      name: user2.name,
      type: 'dm',
      members: [userId1, userId2]
    };
    this.channels.push(newDM);
    this.save(KEYS.CHANNELS, this.channels);
    return newDM;
  }

  // --- Messages ---

  getMessages(channelId: string): Message[] {
    // Only return top-level messages (no threads) for the main channel view
    return this.messages
        .filter(m => m.channelId === channelId && !m.threadId)
        .sort((a, b) => a.timestamp - b.timestamp);
  }

  // ADMIN: Get all messages count or raw
  getAllMessagesGlobal(): Message[] {
      return this.messages;
  }

  getThreadMessages(threadId: string): Message[] {
    return this.messages.filter(m => m.threadId === threadId).sort((a, b) => a.timestamp - b.timestamp);
  }
  
  getMessage(messageId: string): Message | undefined {
    return this.messages.find(m => m.id === messageId);
  }

  // --- Unified Search (Quick Switcher) ---

  searchEverything(query: string, workspaceId: string): SearchResult[] {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // 1. Channels
    this.channels
        .filter(c => c.workspaceId === workspaceId && c.type !== 'dm' && c.name.toLowerCase().includes(lowerQuery))
        .forEach(c => results.push({ type: 'channel', id: c.id, title: c.name, subtitle: c.type, data: c }));

    // 2. Users (for DMs)
    Object.values(this.users)
        .filter(u => u.name.toLowerCase().includes(lowerQuery))
        .forEach(u => results.push({ type: 'user', id: u.id, title: u.name, subtitle: u.email, icon: u.avatar, data: u }));

    // 3. Messages
    const workspaceChannelIds = this.channels.filter(c => c.workspaceId === workspaceId).map(c => c.id);
    this.messages
        .filter(m => workspaceChannelIds.includes(m.channelId) && m.content.toLowerCase().includes(lowerQuery))
        .slice(0, 10) // Limit message results
        .forEach(m => {
            const channel = this.channels.find(c => c.id === m.channelId);
            const user = this.users[m.userId];
            results.push({ 
                type: 'message', 
                id: m.id, 
                title: user?.name || 'Unknown', 
                subtitle: m.content, 
                icon: user?.avatar,
                data: { message: m, channel } 
            });
        });

    return results;
  }

  getMentions(userId: string, workspaceId: string): Message[] {
    const user = this.users[userId];
    if (!user) return [];
    
    const workspaceChannelIds = this.channels
      .filter(c => c.workspaceId === workspaceId)
      .map(c => c.id);

    // Naive mention check: looks for @Name or @everyone
    return this.messages.filter(m => 
        workspaceChannelIds.includes(m.channelId) &&
        (m.content.includes(`@${user.name}`) || m.content.includes('@everyone')) &&
        m.userId !== userId
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  saveMessage(message: Message): void {
    this.messages.push(message);
    
    if (message.threadId) {
        const parent = this.messages.find(m => m.id === message.threadId);
        if (parent) {
            parent.replyCount = (parent.replyCount || 0) + 1;
        }
    }
    
    this.save(KEYS.MESSAGES, this.messages);
  }

  updateMessage(updatedMsg: Message): void {
    this.messages = this.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m);
    this.save(KEYS.MESSAGES, this.messages);
  }

  editMessageContent(messageId: string, newContent: string): Message | null {
      const msgIndex = this.messages.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return null;

      const updated = {
          ...this.messages[msgIndex],
          content: newContent,
          editedAt: Date.now()
      };
      this.messages[msgIndex] = updated;
      this.save(KEYS.MESSAGES, this.messages);
      return updated;
  }

  deleteMessage(messageId: string): void {
      this.messages = this.messages.filter(m => m.id !== messageId && m.threadId !== messageId);
      this.save(KEYS.MESSAGES, this.messages);
  }

  // --- Tasks ---
  
  getTasks(channelId: string): Task[] {
    return this.tasks.filter(t => t.channelId === channelId);
  }

  addTask(task: Task): void {
    this.tasks.push(task);
    this.save(KEYS.TASKS, this.tasks);
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    this.save(KEYS.TASKS, this.tasks);
  }
}

export const db = new PersistenceService();