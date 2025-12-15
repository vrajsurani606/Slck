import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { adminService, SystemStats, AuditLog } from '../services/admin';
import { db } from '../services/persistence';
import { 
    LayoutDashboard, Users, Activity, Settings, 
    ShieldAlert, Database, Server, LogOut, ArrowLeft,
    Search, CheckCircle2, AlertTriangle, XCircle, MoreVertical
} from 'lucide-react';

interface AdminPanelProps {
    currentUser: User;
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onClose }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'settings'>('dashboard');
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchUser, setSearchUser] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setStats(adminService.getSystemStats());
        setLogs(adminService.getAuditLogs());
        setUsers(db.getAllUsers());
    };

    const handleRoleChange = (userId: string, newRole: User['role']) => {
        if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            adminService.updateUserRole(userId, newRole);
            refreshData();
        }
    };

    const handleDeactivate = (userId: string) => {
        if (confirm("Deactivate this user? They will not be able to log in.")) {
            adminService.deactivateUser(userId);
            refreshData();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-[#1a1d21] flex text-gray-900 dark:text-gray-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-[#1a1d21] text-white flex flex-col border-r border-gray-800">
                <div className="h-14 flex items-center px-6 border-b border-gray-800 gap-3">
                    <ShieldAlert className="text-red-500" size={20} />
                    <span className="font-bold tracking-wide">Admin Console</span>
                </div>
                
                <div className="flex-1 py-6 space-y-1">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Users size={18} /> User Management
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 transition-colors ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Activity size={18} /> Audit Logs
                    </button>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={onClose} className="w-full flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Return to Workspace
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-14 bg-white dark:bg-[#222529] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8">
                    <h1 className="text-lg font-bold capitalize">{activeTab.replace('-', ' ')}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Logged in as</span>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="font-bold text-sm">{currentUser.name}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Users size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">+12%</span>
                                    </div>
                                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                    <div className="text-sm text-gray-500">Total Users</div>
                                </div>
                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                            <Database size={24} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{stats.storageUsedMB} MB</div>
                                    <div className="text-sm text-gray-500">Storage Used</div>
                                </div>
                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                            <Server size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">Healthy</span>
                                    </div>
                                    <div className="text-2xl font-bold">{stats.uptime}</div>
                                    <div className="text-sm text-gray-500">System Uptime</div>
                                </div>
                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                            <Activity size={24} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{stats.totalMessages}</div>
                                    <div className="text-sm text-gray-500">Total Messages</div>
                                </div>
                            </div>

                            {/* Charts Simulation */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h3 className="font-bold text-lg mb-6">User Activity (Last 7 Days)</h3>
                                    <div className="flex items-end justify-between h-40 gap-2">
                                        {[40, 65, 30, 80, 55, 90, 75].map((h, i) => (
                                            <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-t-md relative group">
                                                <div 
                                                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-400" 
                                                    style={{ height: `${h}%` }}
                                                ></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-400 uppercase font-bold">
                                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#222529] p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h3 className="font-bold text-lg mb-6">System Logs</h3>
                                    <div className="space-y-3">
                                        {logs.slice(0, 4).map(log => (
                                            <div key={log.id} className="flex items-start gap-3 text-sm">
                                                <div className={`mt-0.5 min-w-[8px] h-2 rounded-full ${log.severity === 'danger' ? 'bg-red-500' : log.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                                <div className="flex-1">
                                                    <span className="font-mono text-xs text-gray-400 mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                    <span className="font-medium">{log.action}</span>
                                                    <p className="text-gray-500 text-xs mt-0.5">{log.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white dark:bg-[#222529] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#2b2f36]">
                                <div className="relative w-64">
                                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search users..." 
                                        value={searchUser}
                                        onChange={e => setSearchUser(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1a1d21] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">Add User</button>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#2b2f36] text-gray-500 font-medium uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase())).map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#2b2f36] transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={user.avatar} className="w-8 h-8 rounded-md" />
                                                <span className="font-bold">{user.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={user.role} 
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                    className={`px-2 py-1 rounded text-xs font-bold uppercase border-none outline-none cursor-pointer ${user.role === 'owner' ? 'bg-purple-100 text-purple-700' : user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                                    disabled={user.role === 'owner' && currentUser.role !== 'owner'}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Admin</option>
                                                    {currentUser.role === 'owner' && <option value="owner">Owner</option>}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <span className="capitalize">{user.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeactivate(user.id)} className="text-gray-400 hover:text-red-500" title="Deactivate User">
                                                    <LogOut size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white dark:bg-[#222529] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2b2f36]">
                                <h3 className="font-bold">Security & Audit Logs</h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.map(log => (
                                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-[#2b2f36] transition-colors">
                                        <div className={`mt-1 p-1.5 rounded-full ${log.severity === 'danger' ? 'bg-red-100 text-red-600' : log.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {log.severity === 'danger' ? <ShieldAlert size={16} /> : log.severity === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-sm">{log.action}</span>
                                                <span className="text-xs text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{log.details}</p>
                                            <p className="text-xs text-gray-400 mt-1">User: {log.userName} (ID: {log.userId})</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};