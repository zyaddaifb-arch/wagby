import { createClient } from './supabase/client';

/**
 * WebMCP Platform Tools for Zakerly
 * 
 * These tools are registered with the browser's AI agent via WebMCP (Chrome 146+).
 */

const registerTool = (navigator as any).modelContext?.registerTool;

export async function searchHomework(params: { query: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('homeworks')
    .select(`
      id, title, description, share_code, is_published,
      profiles (full_name)
    `)
    .eq('is_published', true)
    .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
    .limit(10);

  if (error) return { error: error.message };
  return { results: data };
}

export async function submitAnswer(params: { shareCode: string, studentName: string, answerIndex: number, questionId: string }) {
  // Simple wrapper for submission logic
  // In a real scenario, this would handle the multiple-answer flow, 
  // but for the AI agent tool, we'll make it a single-answer submission for demo purposes.
  const supabase = createClient();
  
  const { data: hw, error: hwError } = await supabase
    .from('homeworks')
    .select('id, is_published, questions(*)') // Use correct nested select syntax
    .eq('share_code', params.shareCode)
    .single();

  if (hwError || !hw || !hw.is_published) {
    return { error: 'Homework not found or unpublished' };
  }

  const { studentName, questionId, answerIndex } = params;
  const optionMap = ['a', 'b', 'c', 'd'];
  const selectedOption = optionMap[answerIndex];

  // Determine if the answer is correct
  const question = hw.questions.find((q: any) => q.id === questionId);
  if (!question) {
    return { error: 'Question not found in homework' };
  }
  const isCorrect = question.correct_answer === selectedOption;

  // 4. Find or Create Submission
  let { data: existingSub } = await supabase
    .from('submissions')
    .select('*')
    .eq('homework_id', hw.id)
    .eq('student_name', studentName)
    .single();

  let submissionId: string;
  
  if (existingSub) {
    submissionId = existingSub.id;
    // Update answer if exists, or insert new
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)
      .single();

    if (existingAnswer) {
      await supabase
        .from('answers')
        .update({
          selected_option: selectedOption,
          is_correct: isCorrect
        })
        .eq('id', existingAnswer.id);
    } else {
      await supabase.from('answers').insert({
        submission_id: submissionId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect
      });
    }

    // Recalculate score
    const { count: newScore } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)
      .eq('is_correct', true);

    await supabase
      .from('submissions')
      .update({ score: newScore || 0, total_questions: hw.questions.length })
      .eq('id', submissionId);

  } else {
    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .insert({
        homework_id: hw.id,
        student_name: studentName,
        score: isCorrect ? 1 : 0,
        total_questions: hw.questions.length,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (subError) return { error: subError.message }; // Changed throw to return error
    submissionId = subData.id;

    await supabase.from('answers').insert({
      submission_id: submissionId,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect
    });
  }

  return { 
    success: true, 
    message: `تم تسليم الإجابة بنجاح لـ ${studentName}. النتيجة الحالية هي ${isCorrect ? 'صحيحة' : 'خاطئة'}.` 
  };
}

export async function getStudentProgress(params: { studentName: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id, score, total_questions, submitted_at,
      homeworks (title)
    `)
    .eq('student_name', params.studentName)
    .order('submitted_at', { ascending: false });

  if (error) return { error: error.message };
  
  const totalSubmissions = data.length;
  const avgScore = totalSubmissions > 0 
    ? (data.reduce((acc, sub) => acc + (sub.score || 0), 0) / data.reduce((acc, sub) => acc + (sub.total_questions || 1), 0)) * 100 
    : 0;

  return {
    studentProject: 'Zakerly',
    studentName: params.studentName,
    stats: {
      totalHomeworksCompleted: totalSubmissions,
      averagePerformance: `${avgScore.toFixed(1)}%`,
      recentSubmissions: data.slice(0, 5)
    }
  };
}

export async function checkStudentBudget(params: { studentName: string }) {
  // Mock budget since there's no billing table yet
  return {
    studentName: params.studentName,
    plan: 'Premium',
    status: 'Active',
    remainingCredits: 'Unlimited',
    expiryDate: '2027-01-01',
    features: ['AI Homework Help', 'Advanced Statistics', 'Priority Grading']
  };
}

export function registerWebMCPTools() {
  if (typeof window === 'undefined' || !registerTool) {
    console.log('WebMCP is not supported in this browser.');
    return;
  }

  try {
    // 1. Register searchHomework
    registerTool({
      name: 'searchHomework',
      description: 'Search for public homework assignments on Zakerly by title or description.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search term (title or subject)' }
        },
        required: ['query']
      },
      handler: searchHomework
    });

    // 2. Register submitAnswer
    registerTool({
      name: 'submitAnswer',
      description: 'Submit an answer for a specific question in a homework assignment.',
      inputSchema: {
        type: 'object',
        properties: {
          shareCode: { type: 'string', description: 'The homework share code (e.g. AB1234)' },
          studentName: { type: 'string', description: 'The name of the student submitting' },
          questionId: { type: 'string', description: 'The unique ID of the question' },
          answerIndex: { type: 'integer', minimum: 0, maximum: 3, description: 'Index of selected option (0-3)' }
        },
        required: ['shareCode', 'studentName', 'questionId', 'answerIndex']
      },
      handler: submitAnswer
    });

    // 3. Register getStudentProgress
    registerTool({
      name: 'getStudentProgress',
      description: 'Retrieve statistical progress and performance for a student on Zakerly.',
      inputSchema: {
        type: 'object',
        properties: {
          studentName: { type: 'string', description: 'The name of the student' }
        },
        required: ['studentName']
      },
      handler: getStudentProgress
    });

    // 4. Register checkStudentBudget
    registerTool({
      name: 'checkStudentBudget',
      description: 'Check naming, subscription plan and remaining credits for a student.',
      inputSchema: {
        type: 'object',
        properties: {
          studentName: { type: 'string', description: 'The name of the student' }
        },
        required: ['studentName']
      },
      handler: checkStudentBudget
    });

    console.log('Successfully registered 4 Zakerly tools via WebMCP.');
  } catch (err) {
    console.error('Failed to register WebMCP tools:', err);
  }
}
