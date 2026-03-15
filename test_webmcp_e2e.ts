import { saveHomework } from './src/app/dashboard/create/actions';
import { searchHomework, submitAnswer, getStudentProgress } from './src/utils/webmcp-tools';

async function runE2ETest() {
  console.log('--- Starting E2E WebMCP Test ---');

  // 1. Create a 10-question homework
  console.log('Step 1: Creating 10-question homework...');
  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: `temp-${i}`,
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
    console.error('Failed to create homework:', createResult.error);
    return;
  }
  
  const { homeworkId, shareCode } = createResult;
  console.log(`Homework created! ID: ${homeworkId}, Share Code: ${shareCode}`);

  // 2. Act as a student: Search for the homework
  console.log('\nStep 2: Searching for homework via WebMCP tool...');
  const searchResult = await searchHomework({ query: 'WebMCP' });
  console.log('Search Results:', JSON.stringify(searchResult.results, null, 2));

  // 3. Act as a student: Solve the homework
  console.log('\nStep 3: Solving homework as "أحمد المتفوق" via WebMCP tool...');
  // We need question IDs to submit answers via the tool
  // The tool submitAnswer currently takes a single answer. 
  // We'll fetch the homework questions first (simulated agent behavior)
  const supabase = (await import('./src/utils/supabase/client')).createClient();
  const { data: hwData } = await supabase.from('homeworks').select('*, questions(*)').eq('id', homeworkId).single();
  
  const studentName = 'أحمد المتفوق';
  for (const q of hwData.questions) {
    console.log(`Submitting answer for question: ${q.question_text}`);
    const subResult = await submitAnswer({
      shareCode: shareCode!,
      studentName,
      questionId: q.id,
      answerIndex: 0 // Always choose option 0 (the correct one in our test)
    });
    console.log('Submission result:', subResult.message || subResult.error);
  }

  // 4. Verify Student Progress
  console.log('\nStep 4: Checking student progress via WebMCP tool...');
  const progress = await getStudentProgress({ studentName });
  console.log('Student Stats:', JSON.stringify(progress.stats, null, 2));

  console.log('\n--- E2E WebMCP Test Completed ---');
  console.log(`You can now check the results at: /dashboard/results/${homeworkId}`);
}

runE2ETest();
