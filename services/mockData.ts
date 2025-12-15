import { User, Channel, Message, Task, Workspace } from '../types';

export const CURRENT_USER_ID = 'u1';

export const mockUsers: Record<string, User> = {
  'u1': { id: 'u1', name: 'Alex Rivera', email: 'alex@nexus.com', avatar: 'https://picsum.photos/200?random=1', status: 'online', role: 'owner' },
  'u2': { id: 'u2', name: 'Sarah Chen', email: 'sarah@nexus.com', avatar: 'https://picsum.photos/200?random=2', status: 'busy', role: 'admin' },
  'u3': { id: 'u3', name: 'Mike Ross', email: 'mike@nexus.com', avatar: 'https://picsum.photos/200?random=3', status: 'offline', role: 'member' },
  'u4': { id: 'u4', name: 'Nexus AI', email: 'ai@nexus.com', avatar: 'https://picsum.photos/200?random=4', status: 'online', role: 'member' },
};

export const mockWorkspaces: Workspace[] = [
  { id: 'w1', name: 'Acme Corp', icon: 'AC', ownerId: 'u1' },
  { id: 'w2', name: 'Dev Team', icon: 'DT', ownerId: 'u1' },
];

export const mockChannels: Channel[] = [
  { id: 'c1', workspaceId: 'w1', name: 'general', type: 'public', description: 'Company-wide announcements and chatter', members: ['u1', 'u2', 'u3', 'u4'] },
  { id: 'c2', workspaceId: 'w1', name: 'engineering', type: 'public', description: 'Tech talk & git blame', members: ['u1', 'u2'] },
  { id: 'c3', workspaceId: 'w1', name: 'marketing', type: 'private', description: 'Top secret campaigns', members: ['u1', 'u3'] },
  { id: 'c4', workspaceId: 'w1', name: 'Sarah Chen', type: 'dm', members: ['u1', 'u2'] },
  { id: 'c5', workspaceId: 'w1', name: 'Nexus AI', type: 'dm', members: ['u1', 'u4'] },
];

export const mockTasks: Task[] = [
  { id: 't1', channelId: 'c2', title: 'Refactor Auth Service', status: 'in-progress', assigneeId: 'u1', dueDate: Date.now() + 86400000 },
  { id: 't2', channelId: 'c2', title: 'Update Documentation', status: 'todo', assigneeId: 'u2' },
  { id: 't3', channelId: 'c1', title: 'Plan Holiday Party', status: 'done', assigneeId: 'u3' },
];

export const initialMessages: Message[] = [
  { id: 'm1', channelId: 'c1', userId: 'u2', content: 'Welcome to the new Nexus platform! 🚀', timestamp: Date.now() - 100000, type: 'text', reactions: { '🔥': ['u1'] } },
  { id: 'm2', channelId: 'c1', userId: 'u3', content: 'This UI is incredibly smooth.', timestamp: Date.now() - 80000, type: 'text' },
  { id: 'm3', channelId: 'c2', userId: 'u2', content: 'Did anyone check the latest PR?', timestamp: Date.now() - 3600000, type: 'text' },
  { id: 'm4', channelId: 'c5', userId: 'u4', content: 'Hello Alex! I am Nexus AI. How can I help you today?', timestamp: Date.now(), type: 'text', isAiGenerated: true },
  { 
    id: 'm5', 
    channelId: 'c1', 
    userId: 'u1', 
    content: 'Where should we go for the team lunch?', 
    timestamp: Date.now() - 50000, 
    type: 'poll', 
    poll: {
      question: 'Where should we go for the team lunch?',
      allowMultiple: false,
      options: [
        { id: 'opt1', text: 'Pizza Palace', votes: ['u2'] },
        { id: 'opt2', text: 'Sushi Spot', votes: ['u3'] },
        { id: 'opt3', text: 'Burger Joint', votes: [] }
      ]
    }
  }
];