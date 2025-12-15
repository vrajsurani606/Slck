export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  statusText?: string; // e.g. "In a meeting"
  statusEmoji?: string; // e.g. "📅"
  role: 'owner' | 'admin' | 'member';
  email: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  savedMessageIds?: string[]; // New field for Bookmarks
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    sound: boolean;
  };
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // Array of User IDs
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  timestamp: number;
  editedAt?: number;
  type: 'text' | 'image' | 'system' | 'poll' | 'file';
  attachments?: { type: string; url: string; name: string; size?: string }[];
  reactions?: Record<string, string[]>; // emoji -> userIds
  threadId?: string;
  replyCount?: number;
  isAiGenerated?: boolean;
  poll?: {
    question: string;
    options: PollOption[];
    allowMultiple: boolean;
  };
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  description?: string;
  members: string[]; // User IDs
  unreadCount?: number;
  isMuted?: boolean;
}

export interface Task {
  id: string;
  channelId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string;
  dueDate?: number;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
}

// UI Types
export type RightPanelType = 'thread' | 'profile' | 'directory' | 'activity' | null;

export interface SearchResult {
    type: 'channel' | 'user' | 'message';
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    data?: any;
}