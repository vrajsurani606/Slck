import React from 'react';
import { Task, User, Message } from '../types';
import { CheckCircle2, Circle, Clock, Plus, MoreHorizontal, Video, Mic, PhoneOff, FileText, Download, Filter } from 'lucide-react';

/* --- FILE BROWSER --- */
interface FileBrowserProps {
    messages: Message[];
    users: Record<string, User>;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ messages, users }) => {
    // Extract files from messages
    const files = messages.flatMap(msg => 
        (msg.attachments || []).map(att => ({
            ...att,
            messageId: msg.id,
            userId: msg.userId,
            timestamp: msg.timestamp
        }))
    );

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">No files yet</h3>
                <p className="text-sm">Share files in chat and they'll appear here.</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Files</h2>
                <button className="flex items-center gap-1 text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700">
                    <Filter size={14} /> Filter
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1e2124] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm" title={file.name}>{file.name}</h4>
                            <p className="text-xs text-gray-500">{file.size || '2MB'} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <img src={users[file.userId]?.avatar} className="w-5 h-5 rounded-full" title={users[file.userId]?.name} />
                                <span className="text-xs text-gray-500">{new Date(file.timestamp).toLocaleDateString()}</span>
                            </div>
                            <button className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1">
                                <Download size={12} /> Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* --- KANBAN BOARD --- */
interface TaskBoardProps {
  tasks: Task[];
  users: Record<string, User>;
  onAddTask: (status: Task['status']) => void;
  onMoveTask: (taskId: string, newStatus: Task['status']) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, users, onAddTask, onMoveTask }) => {
  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-200 dark:bg-gray-700' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'done', label: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
  ];

  return (
    <div className="flex gap-4 h-full p-6 overflow-x-auto bg-gray-50 dark:bg-gray-900">
      {columns.map(col => (
        <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-green-500' : col.id === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
              {col.label} <span className="text-gray-400 ml-1 font-normal">{tasks.filter(t => t.status === col.id).length}</span>
            </h3>
            <button onClick={() => onAddTask(col.id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-[#1f2226] rounded-lg p-2 space-y-2 overflow-y-auto">
            {tasks.filter(t => t.status === col.id).map(task => (
              <div key={task.id} className="bg-white dark:bg-[#2b2f36] p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700 group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{task.title}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex -space-x-1.5">
                     {task.assigneeId && users[task.assigneeId] && (
                       <img src={users[task.assigneeId].avatar} className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-gray-800" title={users[task.assigneeId].name} />
                     )}
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center text-[10px] text-gray-400 gap-1">
                      <Clock size={10} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => onMoveTask(task.id, 'done')} className="text-xs text-green-600 hover:underline">Complete</button>
                </div>
              </div>
            ))}
             <button onClick={() => onAddTask(col.id)} className="w-full py-2 text-sm text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-1">
               <Plus size={14} /> Add Task
             </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* --- CALL INTERFACE --- */
export const VideoCallOverlay = ({ channelName, onClose }: { channelName: string, onClose: () => void }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Mock Video Feeds */}
        <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">You</div>
            <img src="https://picsum.photos/800/600?random=10" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="bg-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">Alex Rivera</div>
            <img src="https://picsum.photos/800/600?random=11" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 right-4 flex gap-2">
                <span className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
        </div>
      </div>
      
      <div className="h-20 bg-[#1a1d21] flex items-center justify-center gap-6 pb-6">
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white"><Mic size={24} /></button>
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white"><Video size={24} /></button>
        <button onClick={onClose} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white"><PhoneOff size={24} /></button>
      </div>
      
      <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <h3 className="font-bold">Huddle in #{channelName}</h3>
        <span className="text-xs text-green-400">02:14 • Connected</span>
      </div>
    </div>
  );
};