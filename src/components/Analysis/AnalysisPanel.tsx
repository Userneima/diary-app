import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../UI/Modal';
import { useAiAnalysis } from '../../hooks/useAiAnalysis';
import { useAiTaskGenerator, type GeneratedTask } from '../../hooks/useAiTaskGenerator';
import { useTasks } from '../../hooks/useTasks';
import { storage } from '../../utils/storage';
import type { AnalysisResult, TaskType } from '../../types';
import { t } from '../../i18n';
import { Wand2, Loader2, Check } from 'lucide-react';

const escapeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

interface Props {
  isOpen: boolean;
  diaryId?: string | null;
  diaryContent: string;
  onClose: () => void;
  onAppendToDiary?: (content: string) => void;
}

export const AnalysisPanel: React.FC<Props> = ({ isOpen, diaryId, diaryContent, onClose, onAppendToDiary }) => {
  const { analyze, loading, error } = useAiAnalysis();
  const { generateTasksFromDiary, loading: taskLoading, error: taskError } = useAiTaskGenerator();
  const { addTask } = useTasks();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultDiaryId, setResultDiaryId] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);

  const history = useMemo(() => {
    if (!isOpen) {
      return [];
    }
    const all = storage.getAnalyses();
    return all
      .filter(a => a.diaryId === (diaryId || null))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [isOpen, diaryId]);

  const selectedResult = useMemo(() => {
    if (selectedHistoryId) {
      const fromHistory = history.find(h => h.id === selectedHistoryId);
      if (fromHistory) {
        return fromHistory;
      }
    }
    const isResultForCurrentDiary = resultDiaryId === (diaryId || null);
    return (isResultForCurrentDiary ? result : null) || history[0] || null;
  }, [history, result, selectedHistoryId, resultDiaryId, diaryId]);

  useEffect(() => {
    if (!isOpen) return;
    if (history.length > 0) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await analyze(diaryId || null, diaryContent);
        if (mounted) {
          setResult(res);
          setResultDiaryId(diaryId || null);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, diaryContent, diaryId, analyze, history.length]);
  const handleAppendToDiary = () => {
    if (!selectedResult || !onAppendToDiary) return;

    // Format the analysis result as HTML
    let appendContent = '\n\n<hr>\n<h3>📊 AI 分析结果</h3>\n';
    appendContent += `<p><em>分析时间: ${new Date(selectedResult.createdAt).toLocaleString()}</em></p>\n`;

    if (selectedResult.summary) {
      appendContent += '<h4>📝 总结</h4>\n';
      appendContent += `<p>${escapeHtml(selectedResult.summary)}</p>\n`;
    }

    if (selectedResult.suggestions && selectedResult.suggestions.length > 0) {
      appendContent += '<h4>💡 建议</h4>\n<ul>\n';
      selectedResult.suggestions.forEach(s => {
        appendContent += `<li>${escapeHtml(s)}</li>\n`;
      });
      appendContent += '</ul>\n';
    }

    if (selectedResult.tags && selectedResult.tags.length > 0) {
      appendContent += '<h4>🏷️ 标签</h4>\n<p>';
      selectedResult.tags.forEach(tag => {
        appendContent += `<span style="background-color: #f3f4f6; padding: 2px 8px; border-radius: 4px; margin-right: 4px;">${escapeHtml(tag)}</span>`;
      });
      appendContent += '</p>\n';
    }

    onAppendToDiary(appendContent);
    onClose();
  };

  const handleReAnalyze = async () => {
    try {
      const res = await analyze(diaryId || null, diaryContent);
      setResult(res);
      setResultDiaryId(diaryId || null);
      setSelectedHistoryId(res.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateTasks = async () => {
    try {
      const tasks = await generateTasksFromDiary(diaryContent);
      setGeneratedTasks(tasks);
      setSelectedTaskIndices(new Set(tasks.map((_, i) => i)));
      setShowTaskGenerator(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTaskIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTaskIndices(newSelected);
  };

  const handleCreateSelectedTasks = () => {
    const selectedTasks = Array.from(selectedTaskIndices)
      .sort((a, b) => a - b)
      .map(i => generatedTasks[i]);

    selectedTasks.forEach(task => {
      const taskData: Partial<Record<string, unknown>> = {
        notes: task.notes,
        taskType: 'long-term' as TaskType,
      };
      addTask(task.title, taskData);
    });

    setShowTaskGenerator(false);
    setGeneratedTasks([]);
    setSelectedTaskIndices(new Set());
  };

  const handleSelectHistory = (id: string) => {
    const sel = history.find(h => h.id === id);
    if (sel) {
      setSelectedHistoryId(id);
      setResult(sel);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('AI Analysis')} maxWidth="4xl">
      <div className="flex gap-6 min-h-[500px]">
        {/* History Sidebar */}
        <div className="w-56 overflow-auto border-r pr-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">{t('History')}</h4>
            <button
              onClick={handleReAnalyze}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {t('Analyze')}
            </button>
          </div>
          <ul className="space-y-2">
            {history.length === 0 && <li className="text-xs text-gray-500">{t('No diaries')}</li>}
            {history.map(h => (
              <li key={h.id}>
                <button
                  onClick={() => handleSelectHistory(h.id)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    selectedHistoryId === h.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700">
                    {new Date(h.createdAt).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">{h.summary.slice(0, 50)}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">{t('Analyzing...')}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {selectedResult && !loading && (
            <div className="space-y-6">
              {/* Summary Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    📝 {t('Summary')}
                  </h4>
                  {selectedResult.source && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {t('Source')}: {selectedResult.source}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedResult.summary}
                </p>
              </div>

              {/* Suggestions Section */}
              {selectedResult.suggestions && selectedResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                    💡 {t('Suggestions')}
                  </h4>
                  <ul className="space-y-2">
                    {selectedResult.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                        <span className="text-blue-600 font-semibold text-sm mt-0.5">{i + 1}.</span>
                        <span className="text-sm text-gray-700 flex-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags Section */}
              {selectedResult.tags && selectedResult.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                    🏷️ {t('Tags')}
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedResult.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t flex justify-between gap-3">
                <button
                  onClick={handleGenerateTasks}
                  disabled={taskLoading || !diaryContent.trim()}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {taskLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {t('Generate Tasks')}
                </button>
                <button
                  onClick={handleAppendToDiary}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  📎 {t('Append to Diary')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Generator Modal */}
      <Modal
        isOpen={showTaskGenerator}
        onClose={() => {
          setShowTaskGenerator(false);
          setGeneratedTasks([]);
          setSelectedTaskIndices(new Set());
        }}
        title={t('Generated Tasks')}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {taskError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{taskError}</p>
            </div>
          )}
          {generatedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t('No tasks generated')}</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                {t('Selected')} {selectedTaskIndices.size}/{generatedTasks.length} {t('tasks')}
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {generatedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleToggleTaskSelection(index)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIndices.has(index)}
                      onChange={() => handleToggleTaskSelection(index)}
                      className="mt-1 cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {task.estimatedDays && (
                          <span>⏱️ {task.estimatedDays} {t('days')}</span>
                        )}
                        {task.priority && (
                          <span className={`
                            ${task.priority === 'high' ? 'text-red-600' : ''}
                            ${task.priority === 'medium' ? 'text-yellow-600' : ''}
                            ${task.priority === 'low' ? 'text-green-600' : ''}
                          `}>
                            Priority: {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowTaskGenerator(false);
                    setGeneratedTasks([]);
                    setSelectedTaskIndices(new Set());
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleCreateSelectedTasks}
                  disabled={selectedTaskIndices.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm inline-flex items-center gap-2"
                >
                  <Check size={16} />
                  {t('Create Tasks')} ({selectedTaskIndices.size})
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Modal>
  );
};
