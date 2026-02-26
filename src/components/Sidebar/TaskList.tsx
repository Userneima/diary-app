import React, { useMemo, useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useAiTaskParser } from '../../hooks/useAiTaskParser';
import { t } from '../../i18n';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, Search, ChevronUp, ChevronDown, Wand2, Loader2, Edit } from 'lucide-react';
import { Modal } from '../UI/Modal';
import type { Task, TaskType } from '../../types';
import type { ParsedPlanItem } from '../../utils/planParser';

interface TaskListProps {
  onModalStateChange?: (hasModalOpen: boolean) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ onModalStateChange }) => {
  const {
    activeTasks,
    futureTasks,
    completedTasks,
    searchQuery,
    setSearchQuery,
    filterTasksBySearch,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    moveTaskUp,
    moveTaskDown
  } = useTasks();

  const { parsePlans, loading: aiLoading, error: aiError } = useAiTaskParser();

  const [activeTab, setActiveTab] = useState<'active' | 'future' | 'completed'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('long-term');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [showAiPlanModal, setShowAiPlanModal] = useState(false);
  const [aiPlanInput, setAiPlanInput] = useState('');
  const [parsedPlans, setParsedPlans] = useState<ParsedPlanItem[]>([]);
  const [aiParseError, setAiParseError] = useState<string | null>(null);

  const hasInvalidPlanDates = useMemo(
    () => parsedPlans.some((plan) => !plan.startDate || !plan.endDate),
    [parsedPlans]
  );

  // Notify parent when modal state changes
  useEffect(() => {
    const hasModalOpen = showCreateModal || showEditModal || showAiPlanModal;
    onModalStateChange?.(hasModalOpen);
  }, [showCreateModal, showEditModal, showAiPlanModal, onModalStateChange]);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const taskData: {
      notes?: string;
      taskType: Task['taskType'];
      startDate?: number;
      endDate?: number;
    } = {
      notes: newTaskNotes.trim() || undefined,
      taskType: newTaskType,
    };

    if (newTaskType === 'time-range') {
      if (newTaskStartDate) {
        taskData.startDate = new Date(newTaskStartDate).getTime();
      }
      if (newTaskEndDate) {
        taskData.endDate = new Date(newTaskEndDate).setHours(23, 59, 59, 999);
      }
    }

    addTask(newTaskTitle.trim(), taskData);

    // Reset form
    setNewTaskTitle('');
    setNewTaskNotes('');
    setNewTaskType('long-term');
    setNewTaskStartDate('');
    setNewTaskEndDate('');
    setShowCreateModal(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskNotes(task.notes || '');
    setNewTaskType(task.taskType);
    setNewTaskStartDate(formatDateInput(task.startDate ?? null));
    setNewTaskEndDate(formatDateInput(task.endDate ?? null));
    setShowEditModal(true);
  };

  const handleUpdateTask = () => {
    if (!editingTaskId || !newTaskTitle.trim()) return;

    const updates: Partial<Task> = {
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim() || undefined,
      taskType: newTaskType,
    };

    if (newTaskType === 'time-range') {
      if (newTaskStartDate) {
        updates.startDate = new Date(newTaskStartDate).getTime();
      }
      if (newTaskEndDate) {
        updates.endDate = new Date(newTaskEndDate).setHours(23, 59, 59, 999);
      }
    } else {
      // Clear dates for long-term tasks
      updates.startDate = null;
      updates.endDate = null;
    }

    updateTask(editingTaskId, updates);

    // Reset form
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskNotes('');
    setNewTaskType('long-term');
    setNewTaskStartDate('');
    setNewTaskEndDate('');
    setShowEditModal(false);
  };

  const formatDateInput = (timestamp: number | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleParsePlans = async () => {
    if (!aiPlanInput.trim()) {
      setAiParseError(t('Please enter your plan text'));
      return;
    }

    setAiParseError(null);
    try {
      const plans = await parsePlans(aiPlanInput.trim(), new Date());
      setParsedPlans(plans);
      if (plans.length === 0) {
        setAiParseError(t('No tasks extracted'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAiParseError(message);
    }
  };

  const handleCreateTasksFromPlans = () => {
    if (parsedPlans.length === 0 || hasInvalidPlanDates) {
      return;
    }

    parsedPlans.forEach((plan) => {
      if (!plan.startDate || !plan.endDate) return;
      addTask(plan.title, {
        notes: plan.notes,
        taskType: 'time-range',
        startDate: plan.startDate,
        endDate: plan.endDate,
      });
    });

    setAiPlanInput('');
    setParsedPlans([]);
    setAiParseError(null);
    setShowAiPlanModal(false);
  };

  const formatDateRange = (startDate: number | null | undefined, endDate: number | null | undefined) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const currentTasks = activeTab === 'active' ? activeTasks : activeTab === 'future' ? futureTasks : completedTasks;
  const filteredTasks = filterTasksBySearch(currentTasks);

  const canMoveUp = (taskId: string) => {
    if (activeTab !== 'active') return false;
    // Disable moving when search is active (to avoid confusion)
    if (searchQuery.trim()) return false;
    const index = currentTasks.findIndex(t => t.id === taskId);
    return index > 0;
  };

  const canMoveDown = (taskId: string) => {
    if (activeTab !== 'active') return false;
    // Disable moving when search is active (to avoid confusion)
    if (searchQuery.trim()) return false;
    const index = currentTasks.findIndex(t => t.id === taskId);
    return index < currentTasks.length - 1;
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)' }}>
      {/* Header - 轻量半透明 */}
      <div className="p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', borderBottom: '1px solid rgba(200, 210, 220, 0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--aurora-primary)' }}>{t('Tasks')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiPlanModal(true)}
              className="p-1.5 rounded-lg transition-colors duration-200"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', color: 'var(--aurora-secondary)' }}
              title={t('AI Parse Plans')}
            >
              <Wand2 size={16} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 text-white rounded-lg transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, var(--aurora-accent), var(--aurora-accent-alt))' }}
              title={t('Create New Task')}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--aurora-muted)' }} />
          <input
            type="text"
            className="w-full rounded-xl px-9 py-2 text-sm transition-colors duration-200 outline-none"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'var(--aurora-primary)' }}
            placeholder={t('Search tasks...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs - 轻量风格 */}
      <div className="px-3 py-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(200, 210, 220, 0.3)' }}>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'active'
                ? 'shadow-sm'
              : ''
          }`}
          style={activeTab === 'active'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.7)', color: 'var(--aurora-accent)' }
            : { color: 'var(--aurora-secondary)' }
          }
        >
          {t('In Progress')} ({activeTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('future')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'future'
              ? 'shadow-sm'
              : ''
          }`}
          style={activeTab === 'future'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.7)', color: 'var(--aurora-accent)' }
            : { color: 'var(--aurora-secondary)' }
          }
        >
          {t('Future')} ({futureTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'completed'
              ? 'shadow-sm'
              : ''
          }`}
          style={activeTab === 'completed'
            ? { backgroundColor: 'rgba(255, 255, 255, 0.7)', color: 'var(--aurora-accent)' }
            : { color: 'var(--aurora-secondary)' }
          }
        >
          {t('Completed')} ({completedTasks.length})
        </button>
        </div>
      </div>

      {/* Task List - 毛玻璃风 */}
      <div className="flex-1 overflow-auto p-3">
        <ul className="space-y-2">
          {filteredTasks.length === 0 ? (
            <li className="text-center text-sm py-8 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', color: 'var(--aurora-muted)' }}>
              {searchQuery ? t('No tasks found') : t('No tasks yet')}
            </li>
          ) : (
            filteredTasks.map(task => (
              <li key={task.id} className="p-3 rounded-xl border transition-colors duration-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: 'rgba(226, 232, 240, 0.6)' }}>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id)}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    {task.taskType === 'long-term' ? (
                      <span title={t('Long-term task')}>
                        <Clock size={12} className="text-gray-400 flex-shrink-0" />
                      </span>
                    ) : (
                      <span title={t('Time-range task')}>
                        <CalendarIcon size={12} className="text-orange-500 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.notes}</p>
                  )}
                  {task.taskType === 'time-range' && task.startDate && task.endDate && (
                    <p className="text-xs text-orange-600 mt-1">
                      {formatDateRange(task.startDate, task.endDate)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {activeTab === 'active' && (
                    <>
                      <button
                        onClick={() => moveTaskUp(task.id)}
                        disabled={!canMoveUp(task.id)}
                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('Move Up')}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveTaskDown(task.id)}
                        disabled={!canMoveDown(task.id)}
                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t('Move Down')}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditTask(task)}
                    className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                    title={t('Edit')}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                    title={t('Delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
        </ul>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('Create New Task')}
      >
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Task Title')}
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder={t('Enter task title')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Task Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Notes')} <span className="text-gray-400 text-xs">({t('Optional')})</span>
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                placeholder={t('Add notes...')}
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Task Type')}
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="taskType"
                    value="long-term"
                    checked={newTaskType === 'long-term'}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                  />
                  <Clock size={16} className="text-gray-600" />
                  <span className="text-sm">{t('Long-term task')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="taskType"
                    value="time-range"
                    checked={newTaskType === 'time-range'}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                  />
                  <CalendarIcon size={16} className="text-orange-500" />
                  <span className="text-sm">{t('Time-range task')}</span>
                </label>
              </div>
            </div>

            {/* Date Range (only for time-range tasks) */}
            {newTaskType === 'time-range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Start Date')}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('End Date')}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTaskEndDate}
                    onChange={(e) => setNewTaskEndDate(e.target.value)}
                    min={newTaskStartDate}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('Create')}
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTaskId(null);
            setNewTaskTitle('');
            setNewTaskNotes('');
            setNewTaskType('long-term');
            setNewTaskStartDate('');
            setNewTaskEndDate('');
          }}
          title={t('Edit Task')}
        >
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Task Title')}
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder={t('Enter task title')}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Task Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Task Notes')}
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                placeholder={t('Add notes...')}
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Task Type')}
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editTaskType"
                    value="long-term"
                    checked={newTaskType === 'long-term'}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                  />
                  <Clock size={16} className="text-gray-600" />
                  <span className="text-sm">{t('Long-term task')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editTaskType"
                    value="time-range"
                    checked={newTaskType === 'time-range'}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                  />
                  <CalendarIcon size={16} className="text-orange-500" />
                  <span className="text-sm">{t('Time-range task')}</span>
                </label>
              </div>
            </div>

            {/* Date Range (only for time-range tasks) */}
            {newTaskType === 'time-range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('Start Date')}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('End Date')}
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTaskEndDate}
                    onChange={(e) => setNewTaskEndDate(e.target.value)}
                    min={newTaskStartDate}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTaskId(null);
                  setNewTaskTitle('');
                  setNewTaskNotes('');
                  setNewTaskType('long-term');
                  setNewTaskStartDate('');
                  setNewTaskEndDate('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('Update')}
              </button>
            </div>
          </div>
        </Modal>

        {/* AI Plan Parse Modal */}
        <Modal
          isOpen={showAiPlanModal}
          onClose={() => setShowAiPlanModal(false)}
          title={t('AI Parse Plans')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('Plan Text')}
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                placeholder={t('Paste your plan text here')}
                value={aiPlanInput}
                onChange={(e) => setAiPlanInput(e.target.value)}
                rows={5}
              />
            </div>

            {(aiParseError || aiError) && (
              <div className="text-sm text-red-600">
                {aiParseError || aiError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleParsePlans}
                disabled={aiLoading}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {aiLoading && <Loader2 size={14} className="animate-spin" />}
                {t('Parse Plans')}
              </button>
            </div>

            {parsedPlans.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">{t('Parsed Tasks')}</div>
                {parsedPlans.map((plan, index) => (
                  <div key={`${plan.title}-${index}`} className="border rounded p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        value={plan.title}
                        onChange={(e) => {
                          const next = parsedPlans.map((item, idx) =>
                            idx === index ? { ...item, title: e.target.value } : item
                          );
                          setParsedPlans(next);
                        }}
                      />
                      <button
                        onClick={() => {
                          const next = parsedPlans.filter((_, idx) => idx !== index);
                          setParsedPlans(next);
                        }}
                        className="px-2 text-red-600 hover:text-red-700"
                        title={t('Delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        value={formatDateInput(plan.startDate)}
                        onChange={(e) => {
                          const value = e.target.value ? new Date(e.target.value) : null;
                          const startDate = value ? value.setHours(0, 0, 0, 0) : null;
                          const endDate = value ? new Date(value).setHours(23, 59, 59, 999) : null;
                          const next = parsedPlans.map((item, idx) =>
                            idx === index ? { ...item, startDate, endDate } : item
                          );
                          setParsedPlans(next);
                        }}
                      />
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        value={formatDateInput(plan.endDate)}
                        onChange={(e) => {
                          const value = e.target.value ? new Date(e.target.value) : null;
                          const endDate = value ? new Date(value).setHours(23, 59, 59, 999) : null;
                          const next = parsedPlans.map((item, idx) =>
                            idx === index ? { ...item, endDate } : item
                          );
                          setParsedPlans(next);
                        }}
                      />
                    </div>
                    <textarea
                      className="w-full border rounded px-2 py-1 text-sm resize-none"
                      placeholder={t('Optional notes')}
                      value={plan.notes || ''}
                      onChange={(e) => {
                        const next = parsedPlans.map((item, idx) =>
                          idx === index ? { ...item, notes: e.target.value } : item
                        );
                        setParsedPlans(next);
                      }}
                      rows={2}
                    />
                    {(!plan.startDate || !plan.endDate) && (
                      <div className="text-xs text-red-600">{t('Please complete dates')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiPlanModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleCreateTasksFromPlans}
                disabled={parsedPlans.length === 0 || hasInvalidPlanDates}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('Create Tasks')}
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
};
