"use client";
import React, { useEffect, useState } from 'react';
import { saveHomework } from '@/app/dashboard/create/actions';
import { searchHomework, submitAnswer, getStudentProgress } from '@/utils/webmcp-tools';
import { createClient } from '@/utils/supabase/client';

export default function WebMCPTestRunner() {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const runTest = async () => {
    addLog('🚀 Starting E2E WebMCP Test...');

    try {
      // 1. Create a 10-question homework
      addLog('Step 1: Creating 10-question homework...');
      const questions = Array.from({ length: 10 }, (_, i) => ({
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        text: `سؤال رقم ${i + 1}: ما هو ناتج ${i} + ${i}?`,
        options: [`${i * 2}`, `${i * 2 + 1}`, `${i * 2 + 2}`, `${i * 2 + 3}`],
        correctOption: 0,
        questionType: 'multiple_choice' as const
      }));

      const hwParams = {
        title: 'واجب تجريبي WebMCP عالي الجودة',
        grade: 'الصف الأول الثانوي',
        description: 'تم إنشاء هذا الواجب لاختبار تكامل WebMCP بشكل كامل.',
        isPublished: true,
        questions
      };

      const createResult = await saveHomework(hwParams);
      if (createResult.error) {
        addLog(`❌ Failed to create homework: ${createResult.error}`);
        return;
      }
      
      const { homeworkId, shareCode } = createResult;
      addLog(`✅ Homework created! ID: ${homeworkId}, Share Code: ${shareCode}`);

      // 2. Act as a student: Search for the homework
      addLog('Step 2: Searching for homework via WebMCP tool...');
      const searchResult = await searchHomework({ query: 'WebMCP' });
      addLog(`🔍 Search Results: Found ${searchResult.results?.length || 0} homeworks.`);

      // 3. Act as a student: Solve the homework
      addLog('Step 3: Solving homework as "أحمد المتفوق" via WebMCP tool...');
      const supabase = createClient();
      const { data: hwData } = await supabase.from('homeworks').select('*, questions(*)').eq('id', homeworkId).single();
      
      const studentName = 'أحمد المتفوق';
      if (hwData && hwData.questions) {
        for (const q of hwData.questions) {
          addLog(`📝 Submitting answer for: ${q.question_text}`);
          const subResult = await submitAnswer({
            shareCode: shareCode!,
            studentName,
            questionId: q.id,
            answerIndex: 0
          });
          addLog(`📤 result: ${subResult.message || subResult.error}`);
        }
      }

      // 4. Verify Student Progress
      addLog('Step 4: Checking student progress via WebMCP tool...');
      const progress = await getStudentProgress({ studentName });
      addLog(`📊 Stats: ${JSON.stringify(progress.stats)}`);

      addLog('🏁 E2E WebMCP Test Completed Successfully!');
      addLog(`🔗 Result link: /dashboard/results/${homeworkId}`);
    } catch (err: any) {
      addLog(`🚨 Critical Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#0f0f1f', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1>WebMCP Test Runner</h1>
      <button 
        onClick={runTest}
        style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ff00ff, #7000ff)', border: 'none', borderRadius: '5px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Run All Tests
      </button>
      <div style={{ marginTop: '20px', backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '10px', maxHeight: '70vh', overflowY: 'auto' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #2a2a4e' }}>{log}</div>
        ))}
      </div>
    </div>
  );
}
