'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, Plus, Trash2, Link as LinkIcon, ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';

interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  parent_id?: string;
  dependencies?: string[];
  assigned_to?: string;
  notes?: string;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
  start_date?: string;
  end_date?: string;
}

interface Contractor {
  id: string;
  name: string;
  specialty?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface CrewMember {
  id: string;
  name: string;
  role?: string;
}

// Custom task interface for the Gantt chart
interface GanttTask {
  id: number;
  name: string;
  startDate: string;
  duration: number;
  dependencies: number[];
  databaseId?: string; // Original database ID for operations
}

export default function ProjectGanttPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<GanttTask | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionFrom, setConnectionFrom] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const dayWidth = 30;
  const rowHeight = 50;
  const leftPanelWidth = 200;
  const headerHeight = 80;

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchTasks();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to fetch project data');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Convert database tasks to Gantt format
      const ganttTasks = (data || []).map((task, index) => {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Ensure ID is a number and handle string UUIDs by using index + 1 as fallback
        let taskId: number;
        if (typeof task.id === 'string' && !isNaN(parseInt(task.id))) {
          taskId = parseInt(task.id);
        } else {
          // For UUID strings, create a consistent numeric ID based on index
          taskId = index + 1;
        }
        
        return {
          id: taskId,
          name: task.name,
          startDate: task.start_date,
          duration: duration || 1,
          dependencies: task.dependencies || [],
          databaseId: task.id // Keep original ID for database operations
        };
      });

      setTasks(ganttTasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'Failed to fetch project tasks');
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range
  const getDateRange = () => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        minDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
        maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
      };
    }

    const dates = tasks.flatMap(task => {
      const start = new Date(task.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + task.duration);
      return [start.getTime(), end.getTime()];
    });
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add buffer
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);
    
    return { minDate, maxDate };
  };

  const { minDate, maxDate } = getDateRange();

  // Generate date headers
  const generateDateHeaders = () => {
    const headers = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return headers;
  };

  const dateHeaders = generateDateHeaders();

  // Calculate task position
  const getTaskPosition = (task: GanttTask) => {
    const startDate = new Date(task.startDate);
    const daysDiff = Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      x: daysDiff * dayWidth,
      width: task.duration * dayWidth
    };
  };

  // Update dependent tasks when a task changes
  const updateDependentTasks = (updatedTask: GanttTask, allTasks: GanttTask[]) => {
    const updatedTasks = [...allTasks];
    const taskIndex = updatedTasks.findIndex(t => t.id === updatedTask.id);
    updatedTasks[taskIndex] = updatedTask;

    const updateTask = (taskId: number) => {
      const task = updatedTasks.find(t => t.id === taskId);
      if (!task) return;

      // Find latest end date of dependencies
      let latestEndDate: Date | null = null;
      task.dependencies.forEach(depId => {
        const depTask = updatedTasks.find(t => t.id === depId);
        if (depTask) {
          const depEndDate = new Date(depTask.startDate);
          depEndDate.setDate(depEndDate.getDate() + depTask.duration);
          if (!latestEndDate || depEndDate > latestEndDate) {
            latestEndDate = depEndDate;
          }
        }
      });

      if (latestEndDate) {
        const newStartDate = new Date(latestEndDate);
        const oldStartDate = new Date(task.startDate);
        
        if (newStartDate.getTime() !== oldStartDate.getTime()) {
          task.startDate = newStartDate.toISOString().split('T')[0];
          
          // Update tasks that depend on this task
          updatedTasks.forEach(t => {
            if (t.dependencies.includes(task.id)) {
              updateTask(t.id);
            }
          });
        }
      }
    };

    // Update all tasks that depend on the changed task
    updatedTasks.forEach(task => {
      if (task.dependencies.includes(updatedTask.id)) {
        updateTask(task.id);
      }
    });

    return updatedTasks;
  };

  // Handle task drag
  const handleTaskMouseDown = (e: React.MouseEvent, task: GanttTask) => {
    if (isConnecting) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    setDraggedTask(task);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isConnecting && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (draggedTask && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      
      // Snap to grid
      const snappedX = Math.round(x / dayWidth) * dayWidth;
      const daysDiff = Math.round(snappedX / dayWidth);
      
      const newStartDate = new Date(minDate);
      newStartDate.setDate(newStartDate.getDate() + daysDiff);
      
      const updatedTask = {
        ...draggedTask,
        startDate: newStartDate.toISOString().split('T')[0]
      };
      
      const newTasks = updateDependentTasks(updatedTask, tasks);
      setTasks(newTasks);
      setDraggedTask(updatedTask);
    }
  };

  const handleMouseUp = () => {
    // If we were dragging a task, save the changes to the database
    if (draggedTask) {
      saveDraggedTaskToDatabase(draggedTask);
    }
    setDraggedTask(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Save dragged task changes to database
  const saveDraggedTaskToDatabase = async (task: GanttTask) => {
    try {
      const databaseId = task.databaseId || task.id.toString();
      
      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          start_date: task.startDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', databaseId);

      if (error) {
        console.error('Error saving dragged task:', error);
        setError(`Failed to update task position: ${error.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error saving dragged task:', error);
      setError(`Failed to update task position: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle connection mode
  const handleConnectionClick = (taskId: number) => {
    if (!isConnecting) {
      setIsConnecting(true);
      setConnectionFrom(taskId);
    } else {
      if (connectionFrom !== taskId && connectionFrom !== null) {
        // Add dependency
        const newTasks = tasks.map(task => {
          if (task.id === taskId && !task.dependencies.includes(connectionFrom)) {
            return { ...task, dependencies: [...task.dependencies, connectionFrom] };
          }
          return task;
        });
        
        // Update the task with the new dependency and propagate changes
        const updatedTask = newTasks.find(t => t.id === taskId);
        if (updatedTask) {
          setTasks(updateDependentTasks(updatedTask, newTasks));
        }
      }
      setIsConnecting(false);
      setConnectionFrom(null);
    }
  };

  // Add new task
  const addTask = async () => {
    try {
      const newTaskData = {
        project_id: projectId,
        name: `New Task ${tasks.length + 1}`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days later
        progress: 0,
        type: 'task' as const,
        assigned_to: null,
        notes: null,
        color: '#3B82F6'
      };

      const { data, error } = await supabase
        .from('project_tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (error) throw error;

      const newTask: GanttTask = {
        id: tasks.length + 1, // Use next sequential number for display
        name: data.name,
        startDate: data.start_date,
        duration: 3,
        dependencies: [],
        databaseId: data.id // Store the actual database ID
      };

      setTasks([...tasks, newTask]);
      setSuccess('Task added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error adding task:', error);
      setError(error.message || 'Failed to add task');
    }
  };

  // Delete task
  const deleteTask = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      const databaseId = task.databaseId || taskId.toString();
      
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', databaseId);

      if (error) throw error;

      const newTasks = tasks.filter(task => task.id !== taskId)
        .map(task => ({
          ...task,
          dependencies: task.dependencies.filter(depId => depId !== taskId)
        }));
      setTasks(newTasks);
      setSuccess('Task deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    }
  };

  // Update task name
  const updateTaskName = async (taskId: number, newName: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      const databaseId = task.databaseId || taskId.toString();
      
      const { error } = await supabase
        .from('project_tasks')
        .update({ name: newName })
        .eq('id', databaseId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, name: newName } : task
      ));
    } catch (error: any) {
      console.error('Error updating task name:', error);
      setError(`Failed to update task name: ${error.message || 'Unknown error'}`);
    }
  };

  // Update task duration
  const updateTaskDuration = async (taskId: number, newDuration: string) => {
    const duration = parseInt(newDuration);
    if (isNaN(duration) || duration < 1) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      const startDate = new Date(task.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      console.log('Updating task:', { taskId, duration, startDate: task.startDate, endDate: endDate.toISOString().split('T')[0] });

      const databaseId = task.databaseId || taskId.toString();

      const { data, error } = await supabase
        .from('project_tasks')
        .update({ 
          end_date: endDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', databaseId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      const updatedTask = { ...task, duration };
      setTasks(updateDependentTasks(updatedTask, tasks));
    } catch (error: any) {
      console.error('Error updating task duration:', error);
      setError(`Failed to update task duration: ${error.message || 'Unknown error'}`);
    }
  };

  // Draw dependency arrows
  const renderDependencyArrows = () => {
    const arrows: React.ReactElement[] = [];
    
    tasks.forEach((task, taskIndex) => {
      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          const depIndex = tasks.indexOf(depTask);
          const depPos = getTaskPosition(depTask);
          const taskPos = getTaskPosition(task);
          
          const startX = depPos.x + depPos.width;
          const startY = depIndex * rowHeight + rowHeight / 2;
          const endX = taskPos.x;
          const endY = taskIndex * rowHeight + rowHeight / 2;
          
          arrows.push(
            <g key={`${depId}-${task.id}`}>
              <path
                d={`M ${startX} ${startY} Q ${startX + 20} ${startY} ${endX - 20} ${endY} Q ${endX} ${endY} ${endX} ${endY}`}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        }
      });
    });
    
    return arrows;
  };

  // Synchronize scrolling between task list and chart
  useEffect(() => {
    const taskList = document.getElementById('task-list');
    const chartArea = document.getElementById('chart-area');
    
    if (!taskList || !chartArea) return;
    
    const syncScroll = (source: Element, target: Element) => {
      target.scrollTop = source.scrollTop;
    };
    
    const handleTaskListScroll = () => {
      syncScroll(taskList, chartArea);
    };
    
    const handleChartAreaScroll = () => {
      syncScroll(chartArea, taskList);
    };
    
    taskList.addEventListener('scroll', handleTaskListScroll);
    chartArea.addEventListener('scroll', handleChartAreaScroll);
    
    return () => {
      taskList.removeEventListener('scroll', handleTaskListScroll);
      chartArea.removeEventListener('scroll', handleChartAreaScroll);
    };
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    
    if (draggedTask || isConnecting) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedTask, isConnecting, dragOffset]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading project timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link 
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Project Timeline
            </h1>
            <p className="text-gray-600">{project?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addTask}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            Add Task
          </button>
          <button
            onClick={() => setIsConnecting(!isConnecting)}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              isConnecting 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <LinkIcon size={16} />
            {isConnecting ? 'Connecting...' : 'Connect Tasks'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Task List (Sticky) */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
          <div className="h-20 border-b border-gray-200 flex items-center px-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Tasks</h3>
          </div>
          <div className="flex-1 overflow-y-auto" id="task-list">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className={`border-b border-gray-100 flex items-center px-4 group ${
                  isConnecting && connectionFrom === task.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => isConnecting && handleConnectionClick(task.id)}
                style={{ height: `${rowHeight}px` }}
              >
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateTaskName(task.id, e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium flex-1"
                    disabled={isConnecting}
                  />
                  <input
                    type="number"
                    value={task.duration}
                    onChange={(e) => updateTaskDuration(task.id, e.target.value)}
                    className="w-12 text-xs bg-gray-100 border border-gray-300 rounded px-1 py-1"
                    min="1"
                    disabled={isConnecting}
                  />
                  <span className="text-xs text-gray-500">days</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Gantt Chart */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Date Headers */}
          <div className="h-20 bg-white border-b border-gray-200 overflow-x-auto">
            <div className="flex h-full" style={{ width: `${dateHeaders.length * dayWidth}px` }}>
              {dateHeaders.map((date, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-center text-xs"
                  style={{ width: `${dayWidth}px` }}
                >
                  <div className="font-semibold text-gray-700">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-gray-500">
                    {date.getDate()}
                  </div>
                  <div className="text-gray-400">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 overflow-auto relative" ref={chartRef} id="chart-area">
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: `${dateHeaders.length * dayWidth}px`, height: `${tasks.length * rowHeight}px` }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
              
              {/* Grid lines */}
              {dateHeaders.map((_, index) => (
                <line
                  key={index}
                  x1={index * dayWidth}
                  y1={0}
                  x2={index * dayWidth}
                  y2={tasks.length * rowHeight}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {/* Dependency arrows */}
              {renderDependencyArrows()}
              
              {/* Connection line while connecting */}
              {isConnecting && connectionFrom && (
                <line
                  x1={getTaskPosition(tasks.find(t => t.id === connectionFrom)!).x + getTaskPosition(tasks.find(t => t.id === connectionFrom)!).width}
                  y1={tasks.findIndex(t => t.id === connectionFrom) * rowHeight + rowHeight / 2}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </svg>
            
            <div style={{ width: `${dateHeaders.length * dayWidth}px`, height: `${tasks.length * rowHeight}px` }}>
              {tasks.map((task, index) => {
                const pos = getTaskPosition(task);
                return (
                  <div
                    key={task.id}
                    className={`absolute flex items-center cursor-pointer ${
                      isConnecting 
                        ? 'cursor-crosshair' 
                        : draggedTask?.id === task.id 
                          ? 'cursor-grabbing' 
                          : 'cursor-grab'
                    }`}
                    style={{
                      left: `${pos.x}px`,
                      top: `${index * rowHeight + 10}px`,
                      width: `${pos.width}px`,
                      height: `${rowHeight - 20}px`
                    }}
                    onMouseDown={(e) => handleTaskMouseDown(e, task)}
                    onClick={() => isConnecting && handleConnectionClick(task.id)}
                  >
                    <div className={`w-full h-full rounded shadow-sm flex items-center px-3 text-white text-sm font-medium ${
                      isConnecting && connectionFrom === task.id 
                        ? 'bg-blue-500' 
                        : 'bg-blue-400 hover:bg-blue-500'
                    }`}>
                      {task.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
