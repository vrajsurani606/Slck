import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Bell, Moon, Shield, Monitor, Volume2, Type, Smile } from 'lucide-react';
import { db } from '../services/persistence';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance'>('profile');
  const [formData, setFormData] = useState(user);

  const handleSave = () => {
    const updated = db.updateUser(user.id, formData);
    onUpdateUser(updated);
    
    // Apply theme immediately if changed
    if (updated.preferences?.theme) {
        const html = document.querySelector('html');
        if (updated.preferences.theme === 'dark') html?.classList.add('dark');
        else if (updated.preferences.theme === 'light') html?.classList.remove('dark');
        else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) html?.classList.add('dark');
            else html?.classList.remove('dark');
        }
    }
    onClose();
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Status', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  return (
    <div className="flex h-full min-h-[500px]">
      {/* Sidebar */}
      <div className="w-48 bg-gray-50 dark:bg-[#1a1d21] border-r border-gray-200 dark:border-gray-700 p-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase px-3 py-2 mb-2">Settings</h2>
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile & Status</h3>
            
            <div className="flex items-center gap-6 mb-6">
                <img src={formData.avatar} className="w-20 h-20 rounded-2xl" />
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">Change Photo</button>
            </div>

            <div className="grid gap-4 max-w-lg">
                <div className="p-4 bg-gray-50 dark:bg-[#1a1d21] rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Current Status</label>
                    <div className="flex gap-2">
                        <div className="w-10 flex items-center justify-center bg-white dark:bg-[#222529] border border-gray-300 dark:border-gray-600 rounded-md text-xl">
                            {formData.statusEmoji || <Smile size={20} className="text-gray-400" />}
                        </div>
                        <input 
                            type="text"
                            value={formData.statusText || ''}
                            onChange={e => setFormData({...formData, statusText: e.target.value})}
                            placeholder="What's happening?"
                            className="flex-1 px-4 py-2 bg-white dark:bg-[#222529] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {[
                            { emoji: '📅', text: 'In a meeting' },
                            { emoji: '🚌', text: 'Commuting' },
                            { emoji: '🤒', text: 'Out sick' },
                            { emoji: '🌴', text: 'Vacationing' },
                            { emoji: '🏡', text: 'Working remotely' }
                        ].map(s => (
                            <button 
                                key={s.text}
                                onClick={() => setFormData({...formData, statusEmoji: s.emoji, statusText: s.text})}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#222529] border border-gray-200 dark:border-gray-700 rounded-full text-xs hover:border-gray-400 whitespace-nowrap"
                            >
                                <span>{s.emoji}</span> {s.text}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-[#1e2124] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">What I do</label>
                    <input 
                        type="text" 
                        value={formData.bio || ''}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        placeholder="e.g. Project Manager"
                        className="w-full px-4 py-2 bg-white dark:bg-[#1e2124] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Availability</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full px-4 py-2 bg-white dark:bg-[#1e2124] border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    >
                        <option value="online">Online</option>
                        <option value="away">Away</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Invisible</option>
                    </select>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Theme & Appearance</h3>
             
             <div className="grid grid-cols-3 gap-4">
                <div 
                    onClick={() => setFormData({...formData, preferences: {...formData.preferences!, theme: 'light'}})}
                    className={`cursor-pointer border-2 rounded-lg p-2 ${formData.preferences?.theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <div className="bg-white border border-gray-200 h-24 rounded mb-2 shadow-sm"></div>
                    <div className="text-center text-sm font-medium dark:text-gray-300">Light</div>
                </div>
                <div 
                    onClick={() => setFormData({...formData, preferences: {...formData.preferences!, theme: 'dark'}})}
                    className={`cursor-pointer border-2 rounded-lg p-2 ${formData.preferences?.theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <div className="bg-gray-900 border border-gray-700 h-24 rounded mb-2 shadow-sm"></div>
                    <div className="text-center text-sm font-medium dark:text-gray-300">Dark</div>
                </div>
                <div 
                     onClick={() => setFormData({...formData, preferences: {...formData.preferences!, theme: 'system'}})}
                     className={`cursor-pointer border-2 rounded-lg p-2 ${formData.preferences?.theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <div className="bg-gradient-to-r from-white to-gray-900 border border-gray-200 h-24 rounded mb-2 shadow-sm"></div>
                    <div className="text-center text-sm font-medium dark:text-gray-300">Auto</div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h3>
              
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1e2124] rounded-lg">
                      <div className="flex items-center gap-3">
                          <Bell size={20} className="text-gray-500" />
                          <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100">Enable Desktop Notifications</div>
                              <div className="text-sm text-gray-500">Receive pop-up notifications when you are mentioned</div>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.preferences?.notifications}
                        onChange={e => setFormData({...formData, preferences: {...formData.preferences!, notifications: e.target.checked}})}
                        className="w-5 h-5 rounded" 
                       />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1e2124] rounded-lg">
                      <div className="flex items-center gap-3">
                          <Volume2 size={20} className="text-gray-500" />
                          <div>
                              <div className="font-bold text-gray-900 dark:text-gray-100">Notification Sound</div>
                              <div className="text-sm text-gray-500">Play a sound when receiving a message</div>
                          </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.preferences?.sound}
                        onChange={e => setFormData({...formData, preferences: {...formData.preferences!, sound: e.target.checked}})}
                        className="w-5 h-5 rounded" 
                      />
                  </div>
              </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-[#007a5a] hover:bg-[#148567] rounded-md shadow-sm">Save Changes</button>
        </div>
      </div>
    </div>
  );
};