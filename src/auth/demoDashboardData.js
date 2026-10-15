const demoTeacherId = '00000000-0000-4000-8000-000000000001';
const demoStudentId = '00000000-0000-4000-8000-000000000002';
const demoStudentName = 'Siswa Demo TKJ';

const lessons = [
  {
    id: 'demo-lesson-network',
    title: 'Mengenal topologi jaringan',
    summary: 'Pengantar topologi star, perangkat jaringan, dan alur koneksi LAN.',
    content: 'Topologi jaringan menggambarkan hubungan antarperangkat. Pada topologi star, perangkat klien terhubung ke perangkat pusat seperti switch. Materi ini hanya contoh untuk pratinjau portal.',
    is_published: true,
    created_at: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'demo-lesson-ip',
    title: 'Dasar alamat IP',
    summary: 'Memahami fungsi alamat IP pada komunikasi jaringan lokal.',
    content: 'Alamat IP membantu mengidentifikasi perangkat pada jaringan. Guru dapat mengganti materi contoh ini dengan bahan ajar TKJ yang sebenarnya.',
    is_published: true,
    created_at: '2026-10-09T08:00:00.000Z',
  },
];

const quizzes = [
  {
    id: 'demo-quiz-network',
    title: 'Kuis dasar jaringan komputer',
    description: 'Contoh kuis jaringan lokal untuk pratinjau antarmuka.',
    is_published: true,
    created_at: '2026-10-11T08:00:00.000Z',
  },
];

const sessions = [
  {
    id: 'demo-session-open',
    title: 'Praktik topologi jaringan',
    is_open: true,
    created_at: '2026-10-14T07:00:00.000Z',
  },
  {
    id: 'demo-session-closed',
    title: 'Pengenalan perangkat jaringan',
    is_open: false,
    created_at: '2026-10-12T07:00:00.000Z',
    closed_at: '2026-10-12T08:00:00.000Z',
  },
];

const attempts = [
  {
    id: 'demo-attempt-network',
    quiz_id: quizzes[0].id,
    student_id: demoStudentId,
    correct_count: 4,
    question_count: 5,
    score: 80,
    submitted_at: '2026-10-13T09:30:00.000Z',
    quiz: { title: quizzes[0].title },
    student: { display_name: demoStudentName },
  },
];

const attendance = [
  {
    id: 'demo-attendance-open',
    session_id: sessions[0].id,
    student_id: demoStudentId,
    status: 'present',
    marked_at: '2026-10-14T07:30:00.000Z',
    student: { display_name: demoStudentName },
  },
  {
    id: 'demo-attendance-closed',
    session_id: sessions[1].id,
    student_id: demoStudentId,
    status: 'present',
    marked_at: '2026-10-12T07:30:00.000Z',
    student: { display_name: demoStudentName },
  },
];

export function getDemoDashboardData(role) {
  if (role === 'teacher') {
    return {
      profiles: [
        { id: demoTeacherId, display_name: 'Guru Demo TKJ', role: 'teacher' },
        { id: demoStudentId, display_name: demoStudentName, role: 'student' },
      ],
      lessons,
      quizzes,
      sessions,
      attempts,
      attendance,
    };
  }

  return {
    lessons,
    quizzes,
    attempts: attempts.filter((attempt) => attempt.student_id === demoStudentId),
    sessions,
    attendance: attendance.filter((record) => record.student_id === demoStudentId),
  };
}
