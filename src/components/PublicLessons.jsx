import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { renderLessonHtml } from '../lib/lessonContent';

const bucket = 'tkj-course-assets';

export default function PublicLessons() {
  const [lessons, setLessons] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [urls, setUrls] = useState(new Map());
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      const [lessonResult, attachmentResult] = await Promise.all([
        supabase.from('lessons').select('id, title, summary, content, created_at').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('lesson_attachments').select('id, lesson_id, storage_path, file_name').order('created_at'),
      ]);
      if (!active) return;
      if (lessonResult.error || attachmentResult.error) {
        setError('Materi belum dapat dimuat. Coba lagi beberapa saat.');
      } else {
        setLessons(lessonResult.data || []);
        setAttachments(attachmentResult.data || []);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected || !supabase) return undefined;
    let active = true;
    setUrls(new Map());
    setError('');
    const files = attachments.filter((file) => file.lesson_id === selected.id);
    async function sign() {
      const signed = new Map();
      for (const file of files) {
        const { data, error: signError } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path, 3600);
        if (signError) throw signError;
        signed.set(file.storage_path, data.signedUrl);
      }
      if (active) setUrls(signed);
    }
    void sign().catch(() => { if (active) setError('Lampiran gagal dimuat. Materi teks tetap dapat dibaca.'); });
    return () => { active = false; };
  }, [selected, attachments]);

  if (selected) {
    const files = attachments.filter((file) => file.lesson_id === selected.id);
    return (
      <div className="public-reader">
        <button className="public-back" type="button" onClick={() => { setSelected(null); setError(''); }}><ArrowLeft size={16} /> Semua materi</button>
        <h3>{selected.title}</h3>
        {selected.summary && <p className="public-summary">{selected.summary}</p>}
        <div className="lesson-reader-content" dangerouslySetInnerHTML={{ __html: renderLessonHtml(selected.content, urls) }} />
        {error && <p className="public-error" role="alert">{error}</p>}
        {files.length > 0 && <div className="public-downloads"><h4>Lampiran</h4><ul>{files.map((file) => <li key={file.id}><FileText size={16} />{urls.has(file.storage_path) ? <a href={urls.get(file.storage_path)} target="_blank" rel="noreferrer">{file.file_name}</a> : <span>{file.file_name} · menyiapkan tautan…</span>}</li>)}</ul></div>}
      </div>
    );
  }

  if (loading) return <p className="public-state" role="status">Memuat materi TKJ…</p>;
  if (error) return <p className="public-state public-error" role="alert">{error}</p>;
  if (!supabase || lessons.length === 0) return <div className="public-state"><BookOpen size={25} /><p>Belum ada materi yang diterbitkan. Kunjungi lagi setelah guru mengunggah modul TKJ.</p></div>;
  return <div className="public-lessons">{lessons.map((lesson, index) => <article className="public-lesson" key={lesson.id}><span className="public-lesson-index">{String(index + 1).padStart(2, '0')} / MATERI</span><h3>{lesson.title}</h3><p>{lesson.summary || 'Materi Teknik Komputer dan Jaringan'}</p><button type="button" onClick={() => setSelected(lesson)}>Baca materi <ArrowRight size={16} /></button></article>)}</div>;
}
