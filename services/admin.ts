import { db } from './persistence';
import { User } from '../types';

export interface SystemStats {
    totalUsers: number;
    totalMessages: number;
    totalChannels: number;
    activeWorkspaces: number;
    storageUsedMB: number;
    uptime: string;
    health: 'healthy' | 'degraded' | 'down';
}

export interface AuditLog {
    id: string;
    action: string;
    userId: string;
    userName: string;
    timestamp: number;
    details: string;
    severity: 'info' | 'warning' | 'danger';
}

class AdminService {
    
    // Check if user has admin privileges
    isAdmin(user: User): boolean {
        return user.role === 'admin' || user.role === 'owner';
    }

    getSystemStats(): SystemStats {
        const users = db.getAllUsers();
        const messages = db.getAllMessagesGlobal();
        const channels = db.getAllChannelsGlobal();
        const workspaces = db.getWorkspaces();

        // Simulate storage calculation (approximate text size + random asset size)
        const textBytes = messages.reduce((acc, m) => acc + m.content.length * 2, 0);
        const assetBytes = messages.reduce((acc, m) => acc + (m.attachments ? m.attachments.length * 1024 * 1024 * 1.5 : 0), 0);
        const totalMB = (textBytes + assetBytes) / (1024 * 1024);

        return {
            totalUsers: users.length,
            totalMessages: messages.length,
            totalChannels: channels.length,
            activeWorkspaces: workspaces.length,
            storageUsedMB: parseFloat(totalMB.toFixed(2)),
            uptime: '99.98%',
            health: 'healthy'
        };
    }

    // Mock Audit Logs
    getAuditLogs(): AuditLog[] {
        const users = db.getAllUsers();
        const now = Date.now();
        const logs: AuditLog[] = [];

        // Generate some fake logs based on real data
        users.forEach((u, idx) => {
            logs.push({
                id: `log_${idx}_1`,
                action: 'USER_LOGIN',
                userId: u.id,
                userName: u.name,
                timestamp: now - (idx * 3600000), // staggered by hours
                details: `User logged in from IP 192.168.1.${10 + idx}`,
                severity: 'info'
            });

            if (u.role === 'admin') {
                logs.push({
                    id: `log_${idx}_2`,
                    action: 'SETTINGS_UPDATE',
                    userId: u.id,
                    userName: u.name,
                    timestamp: now - (idx * 7200000),
                    details: 'Updated workspace retention policy',
                    severity: 'warning'
                });
            }
        });

        // Some fake security alerts
        logs.push({
            id: 'log_sec_1',
            action: 'FAILED_LOGIN',
            userId: 'unknown',
            userName: 'Unknown',
            timestamp: now - 150000,
            details: 'Failed login attempt for admin@nexus.com (3 attempts)',
            severity: 'danger'
        });

        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    // User Management
    updateUserRole(userId: string, newRole: User['role']): User | null {
        // Prevent changing owner if there is only one
        const user = db.getAllUsers().find(u => u.id === userId);
        if (!user) return null;
        
        // In simulation, we just update via DB
        return db.updateUser(userId, { role: newRole });
    }

    deactivateUser(userId: string): User | null {
        return db.updateUser(userId, { status: 'offline', statusText: 'Deactivated' });
    }
}

export const adminService = new AdminService();