import { useCallback, useState } from 'react';
import type { AnalysisResult } from '../types';
import { storage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

const GEMINI_ENDPOINT = 'https://api.gemini.google.com/v1/complete'; // placeholder for Gemini Free

export function useAiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (diaryId: string | null, text: string, opts?: { temperature?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const settings = storage.getAiSettings();
      const geminiKey = settings.geminiApiKey;
      const deepseekKey = settings.deepseekKey;
      const deepseekBase = settings.deepseekBaseUrl || 'https://api.deepseek.com';
      const deepseekModel = settings.deepseekModel || 'deepseek-chat';

      let summary = '';
      let suggestions: string[] = [];
      let tags: string[] = [];
      let source: string | undefined;

      // Prefer DeepSeek if configured (OpenAI-compatible chat endpoint)
      if (deepseekKey) {
        try {
          const endpoint = `${deepseekBase.replace(/\/$/, '')}/v1/chat/completions`;
          const payload = {
            model: deepseekModel,
            messages: [
              { role: 'system', content: '你是一个中文日记分析助手。返回 JSON：{"summary":"...","suggestions":["..."],"tags":["..."]}，不要额外输出其他文本。' },
              { role: 'user', content: `请用中文对以下日记内容做分析：\n\n${text}` },
            ],
            temperature: opts?.temperature ?? 0.3,
            max_tokens: 512,
          };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${deepseekKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`DeepSeek API error: ${res.status}`);
          }

          const data = await res.json();
          const textOut = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || JSON.stringify(data);
          const jsonMatch = textOut.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            summary = parsed.summary || '';
            suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
            tags = Array.isArray(parsed.tags) ? parsed.tags : [];
            source = 'deepseek';
          } else {
            summary = textOut.slice(0, 500);
            source = 'deepseek';
          }
        } catch (apiErr) {
          console.warn('DeepSeek call failed, falling back to Gemini or local analysis', apiErr);
        }
      }

      // If DeepSeek not used or failed, try Gemini if key present
      if (!summary && geminiKey) {
        try {
          const prompt = `请用中文对以下日记内容做分析：\n\n${text}\n\n请返回JSON对象：{"summary":"...","suggestions":["..."],"tags":["..."]}`;
          const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${geminiKey}`,
            },
            body: JSON.stringify({
              prompt,
              temperature: opts?.temperature ?? 0.3,
              max_output_tokens: 512,
            }),
          });

          if (!res.ok) {
            throw new Error(`Gemini API error: ${res.status}`);
          }

          const data = await res.json();
          const textOut = (data?.choices?.[0]?.text || data?.output || JSON.stringify(data));
          const jsonMatch = textOut.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            summary = parsed.summary || '';
            suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
            tags = Array.isArray(parsed.tags) ? parsed.tags : [];
            source = 'gemini';
          } else {
            summary = textOut.slice(0, 500);
            source = 'gemini';
          }
        } catch (apiErr) {
          console.warn('Gemini call failed, falling back to local analysis', apiErr);
        }
      }

      // Local heuristic fallback (if no API key or call failed)
      if (!summary) {
        summary = text.trim().slice(0, 400);
        const sents = text.split(/[。！？\n]+/).map(s => s.trim()).filter(Boolean);
        const negative = sents.filter(s => /没|不|难|纠|焦虑|烦/.test(s));
        suggestions = negative.slice(0, 3).map((s, i) => `注意到可能的痛点："${s}"（建议 ${i + 1}）`);
        const tagSet = new Set<string>();
        ['睡眠','工作','学习','人际','健康','情绪','焦虑','效率','家庭','财务'].forEach(k => {
          if (text.includes(k)) tagSet.add(k);
        });
        tags = Array.from(tagSet);
        source = 'local';
      }

      const result: AnalysisResult = {
        id: uuidv4(),
        diaryId: diaryId || null,
        summary,
        suggestions,
        tags,
        createdAt: Date.now(),
        source,
      };

      // persist
      storage.addAnalysis(result);

      setLoading(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { analyze, loading, error } as const;
}
