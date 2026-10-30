import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  LogOut,
  Plus,
  RefreshCw,
  Router,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import AdminAccounts from '../components/AdminAccounts';
import ResponsiveSidebar from '../components/ResponsiveSidebar';
import { getDemoDashboardData } from '../auth/demoDashboardData';
import { prepareLessonHtml, renderLessonHtml } from '../lib/lessonContent';

const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
const COURSE_ASSET_BUCKET = 'tkj-course-assets';
const MAX_ASSET_SIZE = 10 * 1024 * 1024;
const MAX_LESSON_ASSETS = 15;
const ALLOWED_ASSET_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const teacherTabs = [
  { id: 'overview', label: 'Ringkasan', icon: Activity },
  { id: 'lessons', label: 'Materi TKJ', icon: BookOpen },
  { id: 'quizzes', label: 'Kuis', icon: GraduationCap },
  { id: 'attendance', label: 'Presensi', icon: ClipboardCheck },
];

const studentTabs = [
  { id: 'overview', label: 'Ringkasan', icon: Activity },
  { id: 'lessons', label: 'Materi TKJ', icon: BookOpen },
  { id: 'quizzes', label: 'Kuis', icon: GraduationCap },
  { id: 'attendance', label: 'Presensi', icon: ClipboardCheck },
];

const adminTabs = [
  { id: 'accounts', label: 'Manajemen Akun', icon: Users },
];

const newQuestion = () => ({
  prompt: '',
  choices: ['', '', '', ''],
  correctOption: '0',
});

function messageForError(error) {
  return error instanceof Error ? error.message : 'Permintaan gagal. Periksa koneksi, lalu coba kembali.';
}

function DashboardPage() {
  const { supabase, session, profile, demoMode, signOut: signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [menuHost, setMenuHost] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [realtimeNotice, setRealtimeNotice] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSummary, setLessonSummary] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonEditing, setLessonEditing] = useState(null);
  const [lessonIsPublished, setLessonIsPublished] = useState(true);
  const [lessonStagedAssets, setLessonStagedAssets] = useState([]);
  const [lessonRemovedAttachmentIds, setLessonRemovedAttachmentIds] = useState([]);
  const stagedAssetsRef = useRef(lessonStagedAssets);
  stagedAssetsRef.current = lessonStagedAssets;
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([newQuestion(), newQuestion(), newQuestion()]);
  const [studentQuiz, setStudentQuiz] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [attendanceTitle, setAttendanceTitle] = useState('');

  const isTeacher = profile?.role === 'teacher';
  const isAdmin = profile?.role === 'admin';
  const tabs = isAdmin ? adminTabs : isTeacher ? teacherTabs : studentTabs;
  const displayName = profile?.display_name || session?.user?.email || 'Pengguna TKJ';

  useEffect(() => {
    if (isAdmin) setActiveTab('accounts');
  }, [isAdmin]);

  useEffect(() => () => {
    stagedAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.previewUrl));
  }, []);

  const loadData = useCallback(async (quiet = false) => {
    if (!profile) return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');

    if (isAdmin) {
      setDashboardData({});
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!supabase && demoMode) {
      setDashboardData(getDemoDashboardData(profile.role));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase belum terhubung. Gunakan akun demo untuk pratinjau dashboard.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const requests = isTeacher
        ? [
            supabase.from('profiles').select('id, display_name, role').order('display_name'),
            supabase.from('lessons').select('*').order('created_at', { ascending: false }),
            supabase.from('lesson_attachments').select('*').order('created_at'),
            supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
            supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false }),
            supabase
              .from('quiz_attempts')
              .select('id, quiz_id, student_id, correct_count, question_count, score, submitted_at, quiz:quizzes!quiz_attempts_quiz_id_fkey(title), student:profiles!quiz_attempts_student_id_fkey(display_name)')
              .order('submitted_at', { ascending: false }),
            supabase
              .from('attendance_records')
              .select('id, session_id, student_id, status, marked_at, student:profiles!attendance_records_student_id_fkey(display_name)')
              .order('marked_at', { ascending: false }),
          ]
        : [
            supabase.from('lessons').select('*').eq('is_published', true).order('created_at', { ascending: false }),
            supabase.from('lesson_attachments').select('*').order('created_at'),
            supabase.from('quizzes').select('*').eq('is_published', true).order('created_at', { ascending: false }),
            supabase.from('quiz_attempts').select('*').eq('student_id', profile.id).order('submitted_at', { ascending: false }),
            supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false }),
            supabase.from('attendance_records').select('*').eq('student_id', profile.id).order('marked_at', { ascending: false }),
          ];

      const results = await Promise.all(requests);
      const failedRequest = results.find((result) => result.error);
      if (failedRequest?.error) {
        throw new Error(failedRequest.error.message);
      }

      if (isTeacher) {
        const [
          profilesResult,
          lessonsResult,
          attachmentsResult,
          quizzesResult,
          sessionsResult,
          attemptsResult,
          attendanceResult,
        ] = results;
        setDashboardData({
          profiles: profilesResult.data || [],
          lessons: lessonsResult.data || [],
          attachments: attachmentsResult.data || [],
          quizzes: quizzesResult.data || [],
          sessions: sessionsResult.data || [],
          attempts: attemptsResult.data || [],
          attendance: attendanceResult.data || [],
        });
      } else {
        const [lessonsResult, attachmentsResult, quizzesResult, attemptsResult, sessionsResult, attendanceResult] = results;
        setDashboardData({
          lessons: lessonsResult.data || [],
          attachments: attachmentsResult.data || [],
          quizzes: quizzesResult.data || [],
          attempts: attemptsResult.data || [],
          sessions: sessionsResult.data || [],
          attendance: attendanceResult.data || [],
        });
      }
    } catch (error) {
      setErrorMessage(messageForError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [demoMode, isAdmin, isTeacher, profile, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!supabase || !profile || isAdmin) return undefined;

    const channel = supabase
      .channel(`tkj-dashboard-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_attachments' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_questions' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_attempts' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => void loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => void loadData(true))
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeNotice('Pembaruan langsung tidak tersedia. Gunakan tombol muat ulang untuk melihat data terbaru.');
        } else if (status === 'SUBSCRIBED') {
          setRealtimeNotice('');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, loadData, profile, supabase]);

  const attemptsByQuiz = useMemo(
    () => new Map((dashboardData?.attempts || []).map((attempt) => [attempt.quiz_id, attempt])),
    [dashboardData?.attempts],
  );
  const attendanceBySession = useMemo(
    () => new Map((dashboardData?.attendance || []).map((record) => [record.session_id, record])),
    [dashboardData?.attendance],
  );

  function clearFeedback() {
    setErrorMessage('');
    setSuccessMessage('');
  }

  function stageLessonAssets(files) {
    const selectedFiles = Array.from(files);
    const existingAttachments = (dashboardData?.attachments || []).filter(
      (attachment) => attachment.lesson_id === lessonEditing?.id
        && !lessonRemovedAttachmentIds.includes(attachment.id),
    );
    if (lessonStagedAssets.length + existingAttachments.length + selectedFiles.length > MAX_LESSON_ASSETS) {
      throw new Error(`Maksimal ${MAX_LESSON_ASSETS} lampiran untuk setiap materi.`);
    }
    for (const file of selectedFiles) {
      if (!ALLOWED_ASSET_TYPES.has(file.type)) {
        throw new Error(`${file.name}: gunakan file JPEG, PNG, WebP, atau PDF.`);
      }
      if (file.size === 0 || file.size > MAX_ASSET_SIZE) {
        throw new Error(`${file.name}: ukuran harus lebih dari 0 dan maksimal 10 MB.`);
      }
    }
    const assets = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      file_name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
      previewUrl: URL.createObjectURL(file),
    }));
    setLessonStagedAssets((current) => [...current, ...assets]);
    return assets;
  }

  function removeStagedLessonAsset(assetId) {
    setLessonStagedAssets((current) => {
      const removedAsset = current.find((asset) => asset.id === assetId);
      if (removedAsset) URL.revokeObjectURL(removedAsset.previewUrl);
      return current.filter((asset) => asset.id !== assetId);
    });
  }

  function resetLessonForm() {
    stagedAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.previewUrl));
    setLessonStagedAssets([]);
    setLessonRemovedAttachmentIds([]);
    setLessonEditing(null);
    setLessonTitle('');
    setLessonSummary('');
    setLessonContent('');
    setLessonIsPublished(true);
  }

  function editLesson(lesson) {
    const hasUnsavedChanges = lessonEditing
      || lessonStagedAssets.length > 0
      || lessonTitle.trim()
      || lessonContent.trim();
    if (hasUnsavedChanges && !window.confirm('Ganti materi yang sedang diedit? Perubahan yang belum disimpan akan dibuang.')) return;
    resetLessonForm();
    setLessonEditing(lesson);
    setLessonTitle(lesson.title);
    setLessonSummary(lesson.summary || '');
    setLessonContent(lesson.content || '');
    setLessonIsPublished(lesson.is_published);
    setLessonRemovedAttachmentIds([]);
    setActiveTab('lessons');
    clearFeedback();
  }

  async function saveLesson(event) {
    event.preventDefault();
    const title = lessonTitle.trim();
    const summary = lessonSummary.trim();
    if (!title || !lessonContent.trim()) {
      clearFeedback();
      setErrorMessage('Isi judul dan isi materi sebelum menyimpan.');
      return;
    }
    if (lessonContent.length > 50000) {
      clearFeedback();
      setErrorMessage('Isi materi melebihi batas 50.000 karakter. Ringkas konten sebelum menyimpan.');
      return;
    }
    const action = lessonEditing ? `lesson-${lessonEditing.id}` : 'lesson-save';
    setBusyAction(action);
    clearFeedback();
    const originalAttachments = (dashboardData?.attachments || []).filter(
      (attachment) => attachment.lesson_id === lessonEditing?.id,
    );
    const removedAttachments = originalAttachments.filter(
      (attachment) => lessonRemovedAttachmentIds.includes(attachment.id),
    );
    const remainingPaths = new Set(
      originalAttachments
        .filter((attachment) => !lessonRemovedAttachmentIds.includes(attachment.id))
        .map((attachment) => attachment.storage_path),
    );
    const uploadedPaths = new Map();
    let lessonId = lessonEditing?.id || null;
    let attachmentRowsCreated = false;

    try {
      if (!lessonId) {
        const { data, error } = await supabase.from('lessons').insert({
          author_id: profile.id,
          title,
          summary,
          content: '<p></p>',
          is_published: false,
        }).select('id').single();
        if (error) throw new Error(error.message);
        lessonId = data.id;
      }

      for (const asset of lessonStagedAssets) {
        const extension = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'application/pdf': 'pdf',
        }[asset.mime_type];
        const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from(COURSE_ASSET_BUCKET)
          .upload(path, asset.file, { contentType: asset.mime_type, upsert: false });
        if (error) throw new Error(`Unggah ${asset.file_name} gagal: ${error.message}`);
        uploadedPaths.set(asset.id, path);
      }

      const content = prepareLessonHtml(lessonContent, uploadedPaths, remainingPaths);
      if (!content.trim() || content.length > 50000) {
        throw new Error('Isi materi setelah pemrosesan harus berisi maksimal 50.000 karakter.');
      }
      if (uploadedPaths.size > 0) {
        const newAttachmentRows = lessonStagedAssets.map((asset) => ({
          lesson_id: lessonId,
          author_id: profile.id,
          storage_path: uploadedPaths.get(asset.id),
          file_name: asset.file_name,
          mime_type: asset.mime_type,
          size_bytes: asset.size_bytes,
        }));
        const { error } = await supabase.from('lesson_attachments').insert(newAttachmentRows);
        if (error) throw new Error(`Lampiran belum dapat dicatat: ${error.message}`);
        attachmentRowsCreated = true;
      }

      const { error: saveError } = await supabase.from('lessons').update({
        title,
        summary,
        content,
        is_published: lessonIsPublished,
      }).eq('id', lessonId).select('id').single();
      if (saveError) throw new Error(saveError.message);

      let cleanupWarning = '';
      if (removedAttachments.length > 0) {
        const { error: removeRowsError } = await supabase
          .from('lesson_attachments')
          .delete()
          .in('id', removedAttachments.map((attachment) => attachment.id));
        if (removeRowsError) {
          cleanupWarning = ` Lampiran lama tidak dapat dibersihkan dari daftar: ${removeRowsError.message}`;
        } else {
          const { error: removeFilesError } = await supabase.storage
            .from(COURSE_ASSET_BUCKET)
            .remove(removedAttachments.map((attachment) => attachment.storage_path));
          if (removeFilesError) {
            cleanupWarning = ` Data tersimpan, tetapi file lama belum terhapus dari penyimpanan: ${removeFilesError.message}`;
          }
        }
      }

      const statusText = lessonIsPublished ? 'diterbitkan untuk siswa' : 'disimpan sebagai draf';
      setSuccessMessage(`Materi TKJ berhasil ${statusText}.${cleanupWarning}`);
      resetLessonForm();
      await loadData(true);
    } catch (error) {
      const cleanupErrors = [];
      const uploadedStoragePaths = [...uploadedPaths.values()];
      if (attachmentRowsCreated && uploadedStoragePaths.length > 0) {
        const { error: removeRowsError } = await supabase
          .from('lesson_attachments')
          .delete()
          .in('storage_path', uploadedStoragePaths);
        if (removeRowsError) cleanupErrors.push(`metadata lampiran: ${removeRowsError.message}`);
      }
      if (uploadedStoragePaths.length > 0) {
        const { error: removeFilesError } = await supabase.storage
          .from(COURSE_ASSET_BUCKET)
          .remove(uploadedStoragePaths);
        if (removeFilesError) cleanupErrors.push(`file yang sudah diunggah: ${removeFilesError.message}`);
      }
      if (!lessonEditing && lessonId) {
        const { error: removeLessonError } = await supabase.from('lessons').delete().eq('id', lessonId);
        if (removeLessonError) cleanupErrors.push(`draf materi: ${removeLessonError.message}`);
      }
      const cleanupMessage = cleanupErrors.length
        ? ` Pembersihan juga gagal (${cleanupErrors.join('; ')}).`
        : '';
      setErrorMessage(`Materi belum berhasil disimpan: ${messageForError(error)}${cleanupMessage}`);
    } finally {
      setBusyAction('');
    }
  }

  async function changeLessonPublication(lesson) {
    setBusyAction(`lesson-${lesson.id}`);
    clearFeedback();
    const { error } = await supabase
      .from('lessons')
      .update({ is_published: !lesson.is_published })
      .eq('id', lesson.id);
    setBusyAction('');
    if (error) {
      setErrorMessage(`Status materi tidak berubah: ${error.message}`);
      return;
    }
    setSuccessMessage(lesson.is_published ? 'Materi disimpan sebagai draf.' : 'Materi diterbitkan.');
    await loadData(true);
  }

  async function removeLesson(lesson) {
    if (!window.confirm(`Hapus materi "${lesson.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyAction(`lesson-${lesson.id}`);
    clearFeedback();
    const paths = (dashboardData?.attachments || [])
      .filter((attachment) => attachment.lesson_id === lesson.id)
      .map((attachment) => attachment.storage_path);
    const { error } = await supabase.from('lessons').delete().eq('id', lesson.id).select('id').single();
    if (error) {
      setBusyAction('');
      setErrorMessage(`Materi tidak dapat dihapus: ${error.message}`);
      return;
    }
    if (lessonEditing?.id === lesson.id) resetLessonForm();
    let cleanupMessage = '';
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(COURSE_ASSET_BUCKET).remove(paths);
      if (storageError) cleanupMessage = ` File lampiran perlu dibersihkan dari penyimpanan: ${storageError.message}`;
    }
    setBusyAction('');
    setSuccessMessage(`Materi berhasil dihapus.${cleanupMessage}`);
    await loadData(true);
  }

  function updateQuestion(questionIndex, field, value, choiceIndex = null) {
    setQuizQuestions((currentQuestions) => currentQuestions.map((question, index) => {
      if (index !== questionIndex) return question;
      if (field === 'choices') {
        return {
          ...question,
          choices: question.choices.map((choice, optionIndex) => (
            optionIndex === choiceIndex ? value : choice
          )),
        };
      }
      return { ...question, [field]: value };
    }));
  }

  function addQuestion() {
    if (quizQuestions.length < 12) {
      setQuizQuestions((currentQuestions) => [...currentQuestions, newQuestion()]);
    }
  }

  function removeQuestion(questionIndex) {
    if (quizQuestions.length > 3) {
      setQuizQuestions((currentQuestions) => currentQuestions.filter((_, index) => index !== questionIndex));
    }
  }

  async function createQuiz(event) {
    event.preventDefault();
    const trimmedTitle = quizTitle.trim();
    const trimmedQuestions = quizQuestions.map((question) => ({
      ...question,
      prompt: question.prompt.trim(),
      choices: question.choices.map((choice) => choice.trim()),
    }));
    if (
      !trimmedTitle ||
      trimmedQuestions.some((question) => !question.prompt || question.choices.some((choice) => !choice))
    ) {
      clearFeedback();
      setErrorMessage('Lengkapi judul kuis, pertanyaan, dan semua pilihan jawaban.');
      return;
    }
    setBusyAction('quiz-create');
    clearFeedback();
    let quizId = null;

    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          author_id: profile.id,
          title: trimmedTitle,
          description: quizDescription.trim(),
          is_published: false,
        })
        .select('id')
        .single();
      if (quizError) throw new Error(quizError.message);
      quizId = quiz.id;

      const questionPayload = trimmedQuestions.map((question, index) => ({
        quiz_id: quizId,
        position: index + 1,
        prompt: question.prompt.trim(),
        choices: question.choices.map((choice) => choice.trim()),
      }));
      const { data: savedQuestions, error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionPayload)
        .select('id, position');
      if (questionsError) throw new Error(questionsError.message);

      const answerKeys = savedQuestions.map((question) => ({
        question_id: question.id,
        correct_option: Number(trimmedQuestions[question.position - 1].correctOption),
      }));
      const { error: keysError } = await supabase.from('quiz_answer_keys').insert(answerKeys);
      if (keysError) throw new Error(keysError.message);

      const { error: publishError } = await supabase
        .from('quizzes')
        .update({ is_published: true })
        .eq('id', quizId);
      if (publishError) throw new Error(publishError.message);

      setQuizTitle('');
      setQuizDescription('');
      setQuizQuestions([newQuestion(), newQuestion(), newQuestion()]);
      setSuccessMessage('Kuis berhasil dibuat, dinilai oleh database, dan tersedia bagi siswa TKJ.');
      await loadData(true);
    } catch (error) {
      let message = messageForError(error);
      if (quizId) {
        const { error: cleanupError } = await supabase.from('quizzes').delete().eq('id', quizId);
        if (cleanupError) {
          message += ` Draf kuis ${quizId} masih tersimpan dan perlu dihapus: ${cleanupError.message}`;
        }
      }
      setErrorMessage(`Kuis belum berhasil diterbitkan: ${message}`);
      await loadData(true);
    } finally {
      setBusyAction('');
    }
  }

  async function changeQuizPublication(quiz) {
    setBusyAction(`quiz-${quiz.id}`);
    clearFeedback();
    const { error } = await supabase
      .from('quizzes')
      .update({ is_published: !quiz.is_published })
      .eq('id', quiz.id);
    setBusyAction('');
    if (error) {
      setErrorMessage(`Status kuis tidak berubah: ${error.message}`);
      return;
    }
    setSuccessMessage(quiz.is_published ? 'Kuis disimpan sebagai draf.' : 'Kuis diterbitkan.');
    await loadData(true);
  }

  async function removeQuiz(quiz) {
    if (!window.confirm(`Hapus kuis "${quiz.title}" beserta soal dan hasilnya? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyAction(`quiz-${quiz.id}`);
    clearFeedback();
    const { error } = await supabase.from('quizzes').delete().eq('id', quiz.id);
    setBusyAction('');
    if (error) {
      setErrorMessage(`Kuis tidak dapat dihapus: ${error.message}`);
      return;
    }
    setSuccessMessage('Kuis dan hasil terkait berhasil dihapus.');
    await loadData(true);
  }

  async function openStudentQuiz(quiz) {
    setBusyAction(`open-quiz-${quiz.id}`);
    clearFeedback();
    setQuizResult(null);
    setStudentAnswers({});
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, position, prompt, choices')
      .eq('quiz_id', quiz.id)
      .order('position');
    setBusyAction('');
    if (error) {
      setErrorMessage(`Soal kuis tidak dapat dimuat: ${error.message}`);
      return;
    }
    if (!questions?.length) {
      setErrorMessage('Kuis belum memiliki soal yang tersedia. Beri tahu guru pembuat kuis.');
      return;
    }
    setStudentQuiz({ ...quiz, questions });
  }

  async function submitStudentQuiz(event) {
    event.preventDefault();
    if (!studentQuiz || Object.keys(studentAnswers).length !== studentQuiz.questions.length) return;
    setBusyAction('quiz-submit');
    clearFeedback();
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: studentQuiz.id,
        student_id: profile.id,
        answers: studentAnswers,
      })
      .select('id, score, correct_count, question_count, submitted_at')
      .single();
    setBusyAction('');
    if (error) {
      setErrorMessage(`Jawaban belum berhasil dikirim: ${error.message}`);
      return;
    }
    setQuizResult({ ...data, title: studentQuiz.title });
    setStudentQuiz(null);
    setSuccessMessage('Jawaban dikirim dan dinilai oleh database. Hasil sudah dapat dilihat guru.');
    await loadData(true);
  }

  async function createAttendanceSession(event) {
    event.preventDefault();
    if (!attendanceTitle.trim()) {
      clearFeedback();
      setErrorMessage('Isi nama sesi sebelum membuka presensi.');
      return;
    }
    setBusyAction('attendance-create');
    clearFeedback();
    const { error } = await supabase.from('attendance_sessions').insert({
      teacher_id: profile.id,
      title: attendanceTitle.trim(),
      is_open: true,
    });
    setBusyAction('');
    if (error) {
      setErrorMessage(`Sesi presensi tidak dapat dibuat: ${error.message}`);
      return;
    }
    setAttendanceTitle('');
    setSuccessMessage('Sesi presensi dibuka untuk siswa TKJ.');
    await loadData(true);
  }

  async function closeAttendanceSession(attendanceSession) {
    setBusyAction(`attendance-${attendanceSession.id}`);
    clearFeedback();
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq('id', attendanceSession.id);
    setBusyAction('');
    if (error) {
      setErrorMessage(`Sesi presensi tidak dapat ditutup: ${error.message}`);
      return;
    }
    setSuccessMessage('Sesi presensi ditutup.');
    await loadData(true);
  }

  async function markAttendance(attendanceSession) {
    if (!attendanceSession.is_open) {
      clearFeedback();
      setErrorMessage('Sesi presensi ini sudah ditutup.');
      return;
    }
    setBusyAction(`mark-${attendanceSession.id}`);
    clearFeedback();
    const { error } = await supabase.from('attendance_records').insert({
      session_id: attendanceSession.id,
      student_id: profile.id,
      status: 'present',
    });
    setBusyAction('');
    if (error) {
      setErrorMessage(`Presensi tidak berhasil: ${error.message}`);
      return;
    }
    setSuccessMessage('Presensi berhasil tercatat. Guru dapat melihatnya di dashboard.');
    await loadData(true);
  }

  async function signOut() {
    clearFeedback();
    const { error } = await signOutUser();
    if (error) {
      setErrorMessage(`Anda belum keluar: ${error.message}`);
      return;
    }
    window.location.hash = '#/login';
  }

  if (loading && !dashboardData) {
    return (
      <main className="dashboard-loading">
        <div className="loading-brand"><Router size={21} /> TKJ / PORTAL BELAJAR</div>
        <div className="loading-skeleton"><span /><span /><span /><span /></div>
        <p>Memuat data ruang belajar…</p>
      </main>
    );
  }

  const lessons = dashboardData?.lessons || [];
  const quizzes = dashboardData?.quizzes || [];
  const attempts = dashboardData?.attempts || [];
  const sessions = dashboardData?.sessions || [];
  const attendance = dashboardData?.attendance || [];
  const students = (dashboardData?.profiles || []).filter((person) => person.role === 'student');
  const sectionHeading = tabs.find((tab) => tab.id === activeTab)?.label || 'Ringkasan';

  return (
    <div className="dashboard-layout">
      <ResponsiveSidebar className="dashboard-sidebar" label="Portal TKJ" triggerTarget={menuHost}>
        <a className="dashboard-brand" href="#beranda">
          <img src="/LOGO_SMKN1_GARUT.jpeg" alt="" />
          <span><strong>SMKN 1 Garut</strong><small>Portal TKJ</small></span>
        </a>
        <div className="sidebar-program">
          <span className="sidebar-program-icon"><Router size={18} /></span>
          <span><small>Program keahlian</small><strong>Teknik Komputer dan Jaringan</strong></span>
        </div>
        <nav className="dashboard-nav" aria-label="Navigasi dashboard">
          <span className="sidebar-caption">RUANG KERJA</span>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={activeTab === id ? 'page' : undefined}
              className={activeTab === id ? 'is-active' : ''}
              key={id}
              onClick={() => {
                setActiveTab(id);
                setStudentQuiz(null);
                clearFeedback();
              }}
              type="button"
            >
              <Icon size={18} />
              {label}
              {id === 'lessons' && lessons.length > 0 && <span className="nav-count">{lessons.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="#beranda"><ArrowLeft size={16} /> Kembali ke profil TKJ</a>
          <button type="button" onClick={signOut}><LogOut size={16} /> Keluar</button>
        </div>
      </ResponsiveSidebar>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-menu-host" ref={setMenuHost} />
          <div className="dashboard-breadcrumb">
            <span>Portal TKJ</span><ChevronRight size={14} /><strong>{sectionHeading}</strong>
          </div>
          <div className="dashboard-user">
            <div className="user-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</div>
            <span><strong>{displayName}</strong><small>{isAdmin ? 'Admin Portal' : isTeacher ? 'Guru TKJ' : 'Siswa TKJ'}</small></span>
            <button type="button" aria-label="Keluar dari akun" onClick={signOut}><LogOut size={17} /></button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <h1>{activeTab === 'overview' ? `Halo, ${displayName.split(' ')[0]}.` : sectionHeading}</h1>
              <p>
                {isAdmin
                  ? 'Kelola ID pengguna, peran, status akun, dan kata sandi dari satu tempat.'
                  : isTeacher
                  ? 'Materi, kuis, dan presensi TKJ yang Anda kelola terhubung langsung ke siswa.'
                  : 'Materi dan aktivitas TKJ yang diterbitkan guru tersedia di sini.'}
              </p>
            </div>
            {!isAdmin && (
              <button
                className="refresh-button"
                disabled={refreshing}
                onClick={() => void loadData(true)}
                type="button"
              >
                <RefreshCw size={16} className={refreshing ? 'is-spinning' : ''} />
                Muat ulang
              </button>
            )}
          </div>

          {demoMode && (
            <div className="dashboard-notice is-info demo-dashboard-notice" role="status">
              <ShieldCheck size={18} />
              <span><strong>Dashboard demo.</strong> Data materi, kuis, akun siswa, dan presensi di halaman ini hanya contoh, tidak berasal dari data sekolah, dan perubahan tidak disimpan.</span>
            </div>
          )}

          {realtimeNotice && <div className="dashboard-notice is-info" role="status">{realtimeNotice}</div>}
          {errorMessage && (
            <div className="dashboard-notice is-error" role="alert">
              <CircleAlert size={18} /><span>{errorMessage}</span>
              <button type="button" aria-label="Tutup pesan kesalahan" onClick={() => setErrorMessage('')}><X size={16} /></button>
            </div>
          )}
          {successMessage && (
            <div className="dashboard-notice is-success" role="status">
              <CheckCircle2 size={18} /><span>{successMessage}</span>
              <button type="button" aria-label="Tutup pesan" onClick={() => setSuccessMessage('')}><X size={16} /></button>
            </div>
          )}

          {activeTab === 'accounts' && isAdmin && (
            <AdminAccounts supabase={supabase} currentUserId={profile.id} />
          )}

          {activeTab === 'overview' && !isAdmin && (
            <OverviewPanel
              isTeacher={isTeacher}
              lessons={lessons}
              quizzes={quizzes}
              attempts={attempts}
              sessions={sessions}
              attendance={attendance}
              students={students}
              attendanceBySession={attendanceBySession}
              attemptsByQuiz={attemptsByQuiz}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'lessons' && (
            isTeacher ? (
              <TeacherLessons
                lessons={lessons}
                attachments={dashboardData?.attachments || []}
                supabase={supabase}
                demoMode={demoMode}
                busyAction={busyAction}
                title={lessonTitle}
                summary={lessonSummary}
                content={lessonContent}
                editingLesson={lessonEditing}
                isPublished={lessonIsPublished}
                stagedAssets={lessonStagedAssets}
                removedAttachmentIds={lessonRemovedAttachmentIds}
                onTitleChange={setLessonTitle}
                onSummaryChange={setLessonSummary}
                onContentChange={setLessonContent}
                onStageFiles={stageLessonAssets}
                onRemoveStagedAsset={removeStagedLessonAsset}
                onRemoveAttachment={(id) => setLessonRemovedAttachmentIds((current) => [...current, id])}
                onRestoreAttachment={(id) => setLessonRemovedAttachmentIds((current) => current.filter((value) => value !== id))}
                onPublishedChange={setLessonIsPublished}
                onCancelEdit={resetLessonForm}
                onEdit={editLesson}
                onSave={saveLesson}
                onPublish={changeLessonPublication}
                onDelete={removeLesson}
              />
            ) : (
              <StudentLessons
                lessons={lessons}
                attachments={dashboardData?.attachments || []}
                supabase={supabase}
                demoMode={demoMode}
              />
            )
          )}

          {activeTab === 'quizzes' && (
            isTeacher ? (
              <TeacherQuizzes
                quizzes={quizzes}
                demoMode={demoMode}
                attempts={attempts}
                questions={quizQuestions}
                title={quizTitle}
                description={quizDescription}
                busyAction={busyAction}
                onTitleChange={setQuizTitle}
                onDescriptionChange={setQuizDescription}
                onQuestionChange={updateQuestion}
                onAddQuestion={addQuestion}
                onRemoveQuestion={removeQuestion}
                onCreate={createQuiz}
                onPublish={changeQuizPublication}
                onDelete={removeQuiz}
              />
            ) : (
              <StudentQuizzes
                quizzes={quizzes}
                demoMode={demoMode}
                attemptsByQuiz={attemptsByQuiz}
                selectedQuiz={studentQuiz}
                selectedAnswers={studentAnswers}
                result={quizResult}
                busyAction={busyAction}
                onOpen={openStudentQuiz}
                onAnswer={setStudentAnswers}
                onSubmit={submitStudentQuiz}
                onClose={() => { setStudentQuiz(null); setQuizResult(null); clearFeedback(); }}
              />
            )
          )}

          {activeTab === 'attendance' && (
            isTeacher ? (
              <TeacherAttendance
                sessions={sessions}
                demoMode={demoMode}
                records={attendance}
                title={attendanceTitle}
                busyAction={busyAction}
                onTitleChange={setAttendanceTitle}
                onCreate={createAttendanceSession}
                onClose={closeAttendanceSession}
              />
            ) : (
              <StudentAttendance
                sessions={sessions}
                demoMode={demoMode}
                attendanceBySession={attendanceBySession}
                busyAction={busyAction}
                onMark={markAttendance}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}

function OverviewPanel({
  isTeacher,
  lessons,
  quizzes,
  attempts,
  sessions,
  attendance,
  students,
  attendanceBySession,
  attemptsByQuiz,
  onNavigate,
}) {
  return (
    <>
      <div className="dashboard-metrics">
        <Metric icon={BookOpen} label="Materi TKJ" value={lessons.length} />
        <Metric icon={GraduationCap} label="Kuis tersedia" value={quizzes.length} />
        <Metric icon={ClipboardCheck} label={isTeacher ? 'Sesi presensi' : 'Presensi tercatat'} value={isTeacher ? sessions.length : attendance.length} />
        {isTeacher && <Metric icon={Users} label="Akun siswa" value={students.length} />}
        {!isTeacher && <Metric icon={CheckCircle2} label="Kuis dikerjakan" value={attempts.length} />}
      </div>

      <div className={`dashboard-grid${isTeacher ? '' : ' is-student'}`}>
        <section className="dashboard-panel main-panel">
          <PanelHeading
            title={isTeacher ? 'Materi yang dikelola' : 'Materi untuk dipelajari'}
            action="Semua materi"
            onAction={() => onNavigate('lessons')}
          />
          {lessons.length === 0 ? (
            <EmptyDashboard
              title={isTeacher ? 'Belum ada materi TKJ.' : 'Materi belum diterbitkan guru.'}
              description={isTeacher ? 'Terbitkan materi pertama untuk siswa TKJ dari bagian Materi.' : 'Materi yang diterbitkan guru akan muncul di dashboard ini.'}
              icon={BookOpen}
            />
          ) : (
            <div className="dashboard-list">
              {lessons.slice(0, 4).map((lesson) => (
                <article className="compact-item" key={lesson.id}>
                  <span className="compact-icon"><BookOpen size={17} /></span>
                  <span className="compact-copy"><strong>{lesson.title}</strong><small>{lesson.summary || 'Materi Teknik Komputer dan Jaringan'}</small></span>
                  {isTeacher && <StateBadge published={lesson.is_published} />}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <PanelHeading
            title={isTeacher ? 'Aktivitas siswa' : 'Kuis TKJ'}
            action={isTeacher ? 'Lihat kuis' : 'Semua kuis'}
            onAction={() => onNavigate('quizzes')}
          />
          {isTeacher ? (
            attempts.length === 0 ? (
              <EmptyDashboard title="Belum ada jawaban siswa." description="Hasil muncul di sini setelah siswa menyelesaikan kuis." icon={GraduationCap} />
            ) : (
              <div className="dashboard-list">
                {attempts.slice(0, 4).map((attempt) => (
                  <article className="compact-item" key={attempt.id}>
                    <span className="compact-icon"><CheckCircle2 size={17} /></span>
                    <span className="compact-copy"><strong>{attempt.student?.display_name || 'Siswa TKJ'}</strong><small>{attempt.quiz?.title || 'Kuis TKJ'} · {attempt.correct_count}/{attempt.question_count}</small></span>
                    <span className="score-badge">{attempt.score}%</span>
                  </article>
                ))}
              </div>
            )
          ) : quizzes.length === 0 ? (
            <EmptyDashboard title="Belum ada kuis TKJ." description="Kuis yang diterbitkan guru akan tersedia di sini." icon={GraduationCap} />
          ) : (
            <div className="dashboard-list">
              {quizzes.slice(0, 4).map((quiz) => {
                const attempt = attemptsByQuiz.get(quiz.id);
                return (
                  <article className="compact-item" key={quiz.id}>
                    <span className="compact-icon"><GraduationCap size={17} /></span>
                    <span className="compact-copy"><strong>{quiz.title}</strong><small>{attempt ? `Selesai · skor ${attempt.score}%` : 'Belum dikerjakan'}</small></span>
                    {attempt ? <Check size={17} className="item-done" /> : <ChevronRight size={17} className="item-chevron" />}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <PanelHeading
            title={isTeacher ? 'Presensi terbaru' : 'Presensi terbuka'}
            action="Lihat presensi"
            onAction={() => onNavigate('attendance')}
          />
          {isTeacher ? (
            sessions.length === 0 ? (
              <EmptyDashboard title="Belum ada sesi kelas." description="Buka sesi presensi agar siswa TKJ dapat mencatat kehadiran." icon={ClipboardCheck} />
            ) : (
              <div className="dashboard-list">
                {sessions.slice(0, 4).map((attendanceSession) => {
                  const count = attendance.filter((record) => record.session_id === attendanceSession.id).length;
                  return (
                    <article className="compact-item" key={attendanceSession.id}>
                      <span className="compact-icon"><ClipboardCheck size={17} /></span>
                      <span className="compact-copy"><strong>{attendanceSession.title}</strong><small>{count} siswa hadir</small></span>
                      <span className={`session-dot${attendanceSession.is_open ? ' is-open' : ''}`} />
                    </article>
                  );
                })}
              </div>
            )
          ) : sessions.length === 0 ? (
            <EmptyDashboard title="Tidak ada sesi terbuka." description="Sesi baru dari guru akan tampil di sini." icon={ClipboardCheck} />
          ) : (
            <div className="dashboard-list">
              {sessions.slice(0, 4).map((attendanceSession) => {
                const marked = attendanceBySession.has(attendanceSession.id);
                return (
                  <article className="compact-item" key={attendanceSession.id}>
                    <span className="compact-icon"><ClipboardCheck size={17} /></span>
                    <span className="compact-copy"><strong>{attendanceSession.title}</strong><small>{marked ? 'Presensi sudah tercatat' : attendanceSession.is_open ? 'Menunggu presensi Anda' : 'Sesi ditutup · presensi belum tercatat'}</small></span>
                    {marked ? <Check size={17} className="item-done" /> : <span className={`session-dot${attendanceSession.is_open ? ' is-open' : ''}`} />}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isTeacher && (
          <section className="dashboard-panel roster-panel">
            <PanelHeading title="Komunitas belajar TKJ" />
            <div className="roster-summary">
              <Users size={20} />
              <strong>{students.length}</strong>
              <span>akun siswa terdaftar</span>
            </div>
            <p>Materi, kuis, dan sesi yang Anda terbitkan tersedia bagi siswa TKJ yang masuk ke portal.</p>
          </section>
        )}
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric-item">
      <span className="metric-icon"><Icon size={18} /></span>
      <span><strong>{value}</strong><small>{label}</small></span>
    </div>
  );
}

function PanelHeading({ title, action, onAction }) {
  return (
    <div className="panel-heading-row">
      <h2>{title}</h2>
      {action && (
        <button className="panel-action" type="button" onClick={onAction}>
          {action}<ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function EmptyDashboard({ title, description, icon: Icon }) {
  return (
    <div className="dashboard-empty">
      <Icon size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function StateBadge({ published }) {
  return <span className={`state-badge${published ? ' is-published' : ''}`}>{published ? 'Terbit' : 'Draf'}</span>;
}

function TeacherLessons({
  lessons,
  attachments,
  supabase,
  demoMode,
  busyAction,
  title,
  summary,
  content,
  editingLesson,
  isPublished,
  stagedAssets,
  removedAttachmentIds,
  onTitleChange,
  onSummaryChange,
  onContentChange,
  onStageFiles,
  onRemoveStagedAsset,
  onRemoveAttachment,
  onRestoreAttachment,
  onPublishedChange,
  onCancelEdit,
  onEdit,
  onSave,
  onPublish,
  onDelete,
}) {
  const currentAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.lesson_id === editingLesson?.id),
    [attachments, editingLesson?.id],
  );
  const [signedUrls, setSignedUrls] = useState(new Map());
  const [attachmentError, setAttachmentError] = useState('');
  const lessonBusy = editingLesson ? busyAction === `lesson-${editingLesson.id}` : busyAction === 'lesson-save';

  useEffect(() => {
    let cancelled = false;
    setSignedUrls(new Map());
    setAttachmentError('');
    if (!editingLesson || !supabase || demoMode || currentAttachments.length === 0) {
      return () => { cancelled = true; };
    }
    async function resolveAssets() {
      const resolved = new Map();
      for (const attachment of currentAttachments) {
        const { data, error } = await supabase.storage
          .from(COURSE_ASSET_BUCKET)
          .createSignedUrl(attachment.storage_path, 3600);
        if (error) throw new Error(error.message);
        resolved.set(attachment.storage_path, data.signedUrl);
      }
      if (!cancelled) setSignedUrls(resolved);
    }
    resolveAssets().catch((error) => {
      if (!cancelled) setAttachmentError(`Gambar tersimpan tidak dapat ditampilkan: ${messageForError(error)}`);
    });
    return () => { cancelled = true; };
  }, [currentAttachments, demoMode, editingLesson, supabase]);

  return (
    <div className="workspace-grid">
      <section className="dashboard-panel workspace-form-panel">
        <PanelHeading title={editingLesson ? 'Edit materi TKJ' : 'Buat materi TKJ'} />
        <p className="workspace-description">Susun materi dengan format teks, gambar, dan lampiran PDF. Simpan sebagai draf atau terbitkan untuk siswa.</p>
        {demoMode ? (
          <DemoReadOnlyNotice />
        ) : (
        <form className="workspace-form lesson-author-form" onSubmit={onSave}>
          <label>Judul materi
            <input maxLength={140} required value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Contoh: Dasar topologi jaringan" />
          </label>
          <label>Ringkasan
            <input maxLength={500} value={summary} onChange={(event) => onSummaryChange(event.target.value)} placeholder="Deskripsi singkat materi" />
          </label>
          <div className="lesson-editor-field">
            <span>Isi materi</span>
            <Suspense fallback={<div className="rich-text-loading" aria-live="polite">Menyiapkan editor materi…</div>}>
              <RichTextEditor
                content={editingLesson ? renderLessonHtml(content, signedUrls) : content}
                disabled={lessonBusy}
                onChange={onContentChange}
                onStageFiles={onStageFiles}
                stagedAssets={stagedAssets}
                onRemoveStagedAsset={onRemoveStagedAsset}
              />
            </Suspense>
            <small>Maksimal 50.000 karakter. Berkas gambar dan PDF maksimal 10 MB per file.</small>
          </div>
          {attachmentError && <p className="lesson-asset-error" role="alert">{attachmentError}</p>}
          {editingLesson && currentAttachments.length > 0 && (
            <div className="current-attachment-group">
              <strong>Lampiran tersimpan</strong>
              <ul className="staged-asset-list">
                {currentAttachments.map((attachment) => {
                  const removed = removedAttachmentIds.includes(attachment.id);
                  return (
                    <li className={removed ? 'is-removed' : ''} key={attachment.id}>
                      {attachment.mime_type.startsWith('image/') ? <BookOpen size={15} /> : <ClipboardCheck size={15} />}
                      <span>{attachment.file_name}</span>
                      <button
                        type="button"
                        onClick={() => removed ? onRestoreAttachment(attachment.id) : onRemoveAttachment(attachment.id)}
                      >
                        {removed ? 'Pulihkan' : 'Hapus'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <label className="lesson-publish-toggle">
            <input checked={isPublished} onChange={(event) => onPublishedChange(event.target.checked)} type="checkbox" />
            <span><strong>Terbitkan untuk siswa</strong><small>Jika tidak dicentang, materi hanya tersimpan sebagai draf.</small></span>
          </label>
          <div className="lesson-form-actions">
            <button className="dashboard-primary" disabled={lessonBusy} type="submit">
              <Send size={16} /> {lessonBusy ? 'Menyimpan…' : editingLesson ? 'Simpan perubahan' : 'Simpan materi'}
            </button>
            {editingLesson && (
              <button className="lesson-cancel-button" disabled={lessonBusy} onClick={onCancelEdit} type="button">
                Batal
              </button>
            )}
          </div>
        </form>
        )}
      </section>
      <section className="dashboard-panel workspace-list-panel">
        <PanelHeading title={`Materi Anda · ${lessons.length}`} />
        {lessons.length === 0 ? (
          <EmptyDashboard title="Belum ada materi." description="Materi yang dibuat akan muncul di daftar ini." icon={BookOpen} />
        ) : (
          <div className="owned-resource-list">
            {lessons.map((lesson) => (
              <article className="owned-resource" key={lesson.id}>
                <div className="owned-resource-heading">
                  <span className="compact-icon"><BookOpen size={17} /></span>
                  <span><strong>{lesson.title}</strong><small>{new Date(lesson.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</small></span>
                  <StateBadge published={lesson.is_published} />
                </div>
                {lesson.summary && <p>{lesson.summary}</p>}
                {attachments.filter((attachment) => attachment.lesson_id === lesson.id).length > 0 && (
                  <small className="owned-attachment-count">
                    {attachments.filter((attachment) => attachment.lesson_id === lesson.id).length} lampiran
                  </small>
                )}
                {!demoMode && <div className="resource-actions">
                  <button type="button" disabled={busyAction === `lesson-${lesson.id}`} onClick={() => onEdit(lesson)}>
                    <Eye size={15} /> Edit materi
                  </button>
                  <button type="button" disabled={busyAction === `lesson-${lesson.id}`} onClick={() => void onPublish(lesson)}>
                    <Eye size={15} /> {lesson.is_published ? 'Simpan sebagai draf' : 'Terbitkan'}
                  </button>
                  <button className="is-danger" type="button" disabled={busyAction === `lesson-${lesson.id}`} onClick={() => void onDelete(lesson)}>
                    <X size={15} /> Hapus
                  </button>
                </div>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TeacherQuizzes({
  quizzes,
  demoMode,
  attempts,
  questions,
  title,
  description,
  busyAction,
  onTitleChange,
  onDescriptionChange,
  onQuestionChange,
  onAddQuestion,
  onRemoveQuestion,
  onCreate,
  onPublish,
  onDelete,
}) {
  return (
    <div className="workspace-grid">
      <section className="dashboard-panel workspace-form-panel">
        <PanelHeading title="Buat kuis TKJ" />
        <p className="workspace-description">Kunci jawaban disimpan terpisah dari soal siswa. Nilai dihitung database saat jawaban dikirim.</p>
        {demoMode ? (
          <DemoReadOnlyNotice />
        ) : (
        <form className="workspace-form quiz-author-form" onSubmit={onCreate}>
          <label>Judul kuis
            <input maxLength={140} required value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Contoh: Dasar jaringan komputer" />
          </label>
          <label>Deskripsi
            <input maxLength={500} value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Tujuan atau cakupan kuis" />
          </label>
          {questions.map((question, questionIndex) => (
            <fieldset className="question-editor" key={questionIndex}>
              <legend>
                <span>Soal {String(questionIndex + 1).padStart(2, '0')}</span>
                {questions.length > 3 && (
                  <button type="button" onClick={() => onRemoveQuestion(questionIndex)}>Hapus soal</button>
                )}
              </legend>
              <label className="sr-only" htmlFor={`question-prompt-${questionIndex}`}>Teks soal {questionIndex + 1}</label>
              <textarea
                id={`question-prompt-${questionIndex}`}
                maxLength={1000}
                required
                rows={2}
                value={question.prompt}
                onChange={(event) => onQuestionChange(questionIndex, 'prompt', event.target.value)}
                placeholder="Tuliskan pertanyaan"
              />
              <div className="question-choice-list">
                {question.choices.map((choice, choiceIndex) => (
                  <label className="question-choice" key={choiceIndex}>
                    <input
                      aria-label={`Tandai pilihan ${choiceIndex + 1} sebagai jawaban benar untuk soal ${questionIndex + 1}`}
                      checked={question.correctOption === String(choiceIndex)}
                      name={`correct-${questionIndex}`}
                      onChange={() => onQuestionChange(questionIndex, 'correctOption', String(choiceIndex))}
                      type="radio"
                    />
                    <input
                      aria-label={`Pilihan jawaban ${choiceIndex + 1}`}
                      maxLength={300}
                      required
                      value={choice}
                      onChange={(event) => onQuestionChange(questionIndex, 'choices', event.target.value, choiceIndex)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + choiceIndex)}`}
                    />
                  </label>
                ))}
              </div>
              <small>Pilih radio untuk menandai kunci jawaban soal ini.</small>
            </fieldset>
          ))}
          {questions.length < 12 && (
            <button className="add-question-button" type="button" onClick={onAddQuestion}><Plus size={15} /> Tambah soal</button>
          )}
          <button className="dashboard-primary" disabled={busyAction === 'quiz-create'} type="submit">
            <Send size={16} /> {busyAction === 'quiz-create' ? 'Menyimpan soal…' : 'Terbitkan kuis'}
          </button>
        </form>
        )}
      </section>
      <section className="dashboard-panel workspace-list-panel">
        <PanelHeading title={`Kuis Anda · ${quizzes.length}`} />
        {quizzes.length === 0 ? (
          <EmptyDashboard title="Belum ada kuis TKJ." description="Kuis yang dibuat akan tampil di sini." icon={GraduationCap} />
        ) : (
          <div className="owned-resource-list">
            {quizzes.map((quiz) => {
              const quizAttempts = attempts.filter((attempt) => attempt.quiz_id === quiz.id);
              return (
                <article className="owned-resource" key={quiz.id}>
                  <div className="owned-resource-heading">
                    <span className="compact-icon"><GraduationCap size={17} /></span>
                    <span><strong>{quiz.title}</strong><small>{quizAttempts.length} jawaban siswa</small></span>
                    <StateBadge published={quiz.is_published} />
                  </div>
                  {quiz.description && <p>{quiz.description}</p>}
                  {quizAttempts.length > 0 && (
                    <div className="resource-results">
                      {quizAttempts.slice(0, 5).map((attempt) => (
                        <span key={attempt.id}>{attempt.student?.display_name || 'Siswa'} <strong>{attempt.score}%</strong></span>
                      ))}
                      {quizAttempts.length > 5 && <small>dan {quizAttempts.length - 5} siswa lainnya</small>}
                    </div>
                  )}
                  {!demoMode && <div className="resource-actions">
                    <button type="button" disabled={busyAction === `quiz-${quiz.id}`} onClick={() => void onPublish(quiz)}>
                      <Eye size={15} /> {quiz.is_published ? 'Simpan sebagai draf' : 'Terbitkan'}
                    </button>
                    <button className="is-danger" type="button" disabled={busyAction === `quiz-${quiz.id}`} onClick={() => void onDelete(quiz)}>
                      <X size={15} /> Hapus
                    </button>
                  </div>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StudentLessons({ lessons, attachments, supabase, demoMode }) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [signedUrls, setSignedUrls] = useState(new Map());
  const [assetError, setAssetError] = useState('');
  const selectedAttachments = useMemo(
    () => selectedLesson
      ? attachments.filter((attachment) => attachment.lesson_id === selectedLesson.id)
      : [],
    [selectedLesson?.id, attachments],
  );

  useEffect(() => {
    let cancelled = false;
    setSignedUrls(new Map());
    setAssetError('');
    if (!selectedLesson || !supabase || demoMode || selectedAttachments.length === 0) {
      return () => { cancelled = true; };
    }

    async function resolveAssets() {
      const resolved = new Map();
      for (const attachment of selectedAttachments) {
        if (resolved.has(attachment.storage_path)) continue;
        const { data, error } = await supabase.storage
          .from(COURSE_ASSET_BUCKET)
          .createSignedUrl(attachment.storage_path, 3600);
        if (error) throw new Error(error.message);
        resolved.set(attachment.storage_path, data.signedUrl);
      }
      if (!cancelled) setSignedUrls(resolved);
    }

    resolveAssets().catch((error) => {
      if (!cancelled) setAssetError(`Lampiran tidak dapat dimuat: ${messageForError(error)}`);
    });
    return () => { cancelled = true; };
  }, [selectedLesson, selectedAttachments, supabase, demoMode]);

  if (lessons.length === 0) {
    return <EmptyWorkspace title="Belum ada materi diterbitkan." description="Materi TKJ akan tampil setelah guru menerbitkannya." icon={BookOpen} />;
  }
  if (selectedLesson) {
    return (
      <section className="dashboard-panel lesson-reader">
        <button className="back-to-list" type="button" onClick={() => setSelectedLesson(null)}><ArrowLeft size={15} /> Kembali ke materi</button>
        <h2>{selectedLesson.title}</h2>
        {selectedLesson.summary && <p className="lesson-reader-summary">{selectedLesson.summary}</p>}
        <div
          className="lesson-reader-content"
          dangerouslySetInnerHTML={{ __html: renderLessonHtml(selectedLesson.content, signedUrls) }}
        />
        {assetError && <p className="lesson-asset-error" role="alert">{assetError}</p>}
        {selectedAttachments.length > 0 && (
          <section className="lesson-downloads" aria-labelledby="lesson-download-heading">
            <h3 id="lesson-download-heading">Lampiran materi</h3>
            {demoMode ? (
              <p>Lampiran belum tersedia pada pratinjau demo.</p>
            ) : (
              <ul>
                {selectedAttachments.map((attachment) => (
                  <li key={attachment.id}>
                    <FileText size={16} />
                    {signedUrls.has(attachment.storage_path) ? (
                      <a href={signedUrls.get(attachment.storage_path)} target="_blank" rel="noreferrer">
                        {attachment.file_name}
                      </a>
                    ) : (
                      <span>{attachment.file_name} · menyiapkan tautan aman…</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </section>
    );
  }
  return (
    <div className="student-resource-grid">
      {lessons.map((lesson) => (
        <article className="student-resource-card" key={lesson.id}>
          <span className="compact-icon"><BookOpen size={18} /></span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary || 'Materi Teknik Komputer dan Jaringan'}</p>
          <button type="button" onClick={() => setSelectedLesson(lesson)}>Buka materi <ArrowRight size={15} /></button>
        </article>
      ))}
    </div>
  );
}

function StudentQuizzes({
  quizzes,
  demoMode,
  attemptsByQuiz,
  selectedQuiz,
  selectedAnswers,
  result,
  busyAction,
  onOpen,
  onAnswer,
  onSubmit,
  onClose,
}) {
  if (result) {
    return (
      <section className="dashboard-panel student-quiz-result" role="status">
        <CheckCircle2 size={25} />
        <h2>Jawaban terkirim.</h2>
        <p>{result.title} · {result.correct_count} dari {result.question_count} benar · <strong>{result.score}%</strong></p>
        <span>Nilai dihitung oleh database. Guru dapat melihat hasilnya.</span>
        <button className="dashboard-primary" type="button" onClick={onClose}>Kembali ke daftar kuis</button>
      </section>
    );
  }
  if (selectedQuiz) {
    const answered = Object.keys(selectedAnswers).length === selectedQuiz.questions.length;
    return (
      <section className="dashboard-panel student-quiz-panel">
        <button className="back-to-list" type="button" onClick={onClose}><ArrowLeft size={15} /> Semua kuis</button>
        <div className="student-quiz-title"><span className="state-badge is-published">Kuis TKJ</span><h2>{selectedQuiz.title}</h2>{selectedQuiz.description && <p>{selectedQuiz.description}</p>}</div>
        <form onSubmit={onSubmit}>
          <div className="student-question-list">
            {selectedQuiz.questions.map((question, questionIndex) => (
              <fieldset className="student-question" key={question.id}>
                <legend><span>{String(questionIndex + 1).padStart(2, '0')}</span>{question.prompt}</legend>
                <div className="student-choice-list">
                  {question.choices.map((choice, choiceIndex) => (
                    <label className={String(selectedAnswers[question.id]) === String(choiceIndex) ? 'is-selected' : ''} key={choiceIndex}>
                      <input
                        checked={String(selectedAnswers[question.id]) === String(choiceIndex)}
                        name={`answer-${question.id}`}
                        onChange={() => onAnswer((answers) => ({ ...answers, [question.id]: choiceIndex }))}
                        type="radio"
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="student-quiz-submit">
            <span>Hanya satu percobaan. Pastikan semua jawaban sudah benar.</span>
            <button className="dashboard-primary" disabled={!answered || busyAction === 'quiz-submit'} type="submit">
              {busyAction === 'quiz-submit' ? 'Mengirim jawaban…' : 'Kirim jawaban'} <Send size={15} />
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (quizzes.length === 0) {
    return <EmptyWorkspace title="Belum ada kuis tersedia." description="Kuis yang diterbitkan guru TKJ akan muncul di sini." icon={GraduationCap} />;
  }
  return (
    <div className="student-resource-grid">
      {quizzes.map((quiz) => {
        const attempt = attemptsByQuiz.get(quiz.id);
        return (
          <article className="student-resource-card" key={quiz.id}>
            <span className="compact-icon"><GraduationCap size={18} /></span>
            <h2>{quiz.title}</h2>
            <p>{quiz.description || 'Latihan pengetahuan Teknik Komputer dan Jaringan.'}</p>
            {attempt ? (
              <div className="attempt-complete"><CheckCircle2 size={16} /> Selesai · skor {attempt.score}%</div>
            ) : demoMode ? (
              <div className="demo-action-unavailable">Pengerjaan kuis aktif setelah Supabase terhubung.</div>
            ) : (
              <button type="button" disabled={busyAction === `open-quiz-${quiz.id}`} onClick={() => void onOpen(quiz)}>
                {busyAction === `open-quiz-${quiz.id}` ? 'Memuat soal…' : 'Mulai kuis'} <ArrowRight size={15} />
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

function TeacherAttendance({ sessions, records, title, busyAction, onTitleChange, onCreate, onClose, demoMode }) {
  return (
    <div className="workspace-grid">
      <section className="dashboard-panel workspace-form-panel">
        <PanelHeading title="Buka sesi presensi" />
        <p className="workspace-description">Siswa TKJ akan melihat sesi yang terbuka dan dapat mencatat kehadiran satu kali.</p>
        {demoMode ? (
          <DemoReadOnlyNotice />
        ) : (
        <form className="workspace-form" onSubmit={onCreate}>
          <label>Nama sesi
            <input maxLength={140} required value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Contoh: Praktik konfigurasi router" />
          </label>
          <div className="attendance-safety-note"><ShieldCheck size={17} /> Presensi hanya untuk aktivitas belajar TKJ dalam portal ini.</div>
          <button className="dashboard-primary" disabled={busyAction === 'attendance-create'} type="submit">
            <Plus size={16} /> {busyAction === 'attendance-create' ? 'Membuka sesi…' : 'Buka sesi presensi'}
          </button>
        </form>
        )}
      </section>
      <section className="dashboard-panel workspace-list-panel">
        <PanelHeading title={`Sesi presensi · ${sessions.length}`} />
        {sessions.length === 0 ? (
          <EmptyDashboard title="Belum ada sesi presensi." description="Sesi yang dibuat akan tampil di sini." icon={ClipboardCheck} />
        ) : (
          <div className="owned-resource-list">
            {sessions.map((attendanceSession) => {
              const sessionRecords = records.filter((record) => record.session_id === attendanceSession.id);
              return (
                <article className="owned-resource" key={attendanceSession.id}>
                  <div className="owned-resource-heading">
                    <span className="compact-icon"><ClipboardCheck size={17} /></span>
                    <span><strong>{attendanceSession.title}</strong><small>{sessionRecords.length} siswa · {new Date(attendanceSession.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</small></span>
                    <span className={`state-badge${attendanceSession.is_open ? ' is-published' : ''}`}>{attendanceSession.is_open ? 'Terbuka' : 'Ditutup'}</span>
                  </div>
                  {sessionRecords.length > 0 && (
                    <div className="resource-results">
                      {sessionRecords.slice(0, 8).map((record) => (
                        <span key={record.id}>{record.student?.display_name || 'Siswa TKJ'} <small>{new Date(record.marked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small></span>
                      ))}
                      {sessionRecords.length > 8 && <small>dan {sessionRecords.length - 8} siswa lainnya</small>}
                    </div>
                  )}
                  {!demoMode && attendanceSession.is_open && (
                    <div className="resource-actions">
                      <button type="button" disabled={busyAction === `attendance-${attendanceSession.id}`} onClick={() => void onClose(attendanceSession)}>
                        <X size={15} /> Tutup sesi
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StudentAttendance({ sessions, attendanceBySession, busyAction, onMark, demoMode }) {
  if (sessions.length === 0) {
    return <EmptyWorkspace title="Belum ada sesi presensi." description="Sesi yang dibuka guru TKJ akan muncul di sini." icon={ClipboardCheck} />;
  }
  return (
    <div className="student-resource-grid attendance-resource-grid">
      {sessions.map((attendanceSession) => {
        const record = attendanceBySession.get(attendanceSession.id);
        return (
          <article className="student-resource-card attendance-card" key={attendanceSession.id}>
            <span className="compact-icon"><ClipboardCheck size={18} /></span>
            <h2>{attendanceSession.title}</h2>
            <p>{attendanceSession.is_open ? 'Sesi dibuka' : 'Sesi ditutup'} {new Date(attendanceSession.closed_at || attendanceSession.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            {record ? (
              <div className="attempt-complete"><CheckCircle2 size={16} /> Hadir · {new Date(record.marked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
            ) : !attendanceSession.is_open ? (
              <div className="attendance-closed"><CircleAlert size={16} /> Sesi berakhir sebelum presensi Anda tercatat.</div>
            ) : demoMode ? (
              <div className="demo-action-unavailable">Pencatatan presensi aktif setelah Supabase terhubung.</div>
            ) : (
              <button
                type="button"
                disabled={busyAction === `mark-${attendanceSession.id}`}
                onClick={() => void onMark(attendanceSession)}
              >
                {busyAction === `mark-${attendanceSession.id}` ? 'Mencatat…' : 'Saya hadir'} <Check size={16} />
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

function DemoReadOnlyNotice() {
  return (
    <div className="demo-readonly-notice">
      <ShieldCheck size={18} />
      <span>Pratinjau hanya-baca. Hubungkan Supabase untuk menyimpan materi, kuis, dan presensi.</span>
    </div>
  );
}

function EmptyWorkspace({ title, description, icon: Icon }) {
  return (
    <section className="dashboard-panel workspace-empty">
      <EmptyDashboard title={title} description={description} icon={Icon} />
    </section>
  );
}

export default DashboardPage;
