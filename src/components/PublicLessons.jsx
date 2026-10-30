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
  const [attachmentError, setAttachmentError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      setError('');
      try {
      const lessonResult = await supabase.from('lessons').select('id, title, summary, content, created_at').eq('is_published', true).order('created_at', { ascending: false });
      if (lessonResult.error) throw lessonResult.error;
      if (active) {
        const next = lessonResult.data || [];
        setLessons(next);
        setSelected((current) => current ? next.find((lesson) => lesson.id === current.id) || null : null);
      }
      } catch {
        if (active) {
        setError('Materi belum dapat dimuat. Coba lagi beberapa saat.');
        }
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [revision]);

  useEffect(() => {
    if (!selected || !supabase) return undefined;
    let active = true;
    setAttachments([]);
    setAttachmentError('');
    void supabase.from('lesson_attachments').select('id, lesson_id, storage_path, file_name').eq('lesson_id', selected.id).order('created_at')
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setAttachmentError('Lampiran belum dapat dimuat. Teks materi tetap tersedia.');
        else setAttachments(data || []);
      }).catch(() => { if (active) setAttachmentError('Koneksi lampiran gagal. Coba buka kembali materi.'); });
    return () => { active = false; };
  }, [selected?.id, revision]);

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
        {attachmentError && <p className="public-error" role="alert">{attachmentError}</p>}
        {files.length > 0 && <div className="public-downloads"><h4>Lampiran</h4><ul>{files.map((file) => <li key={file.id}><FileText size={16} />{urls.has(file.storage_path) ? <a href={urls.get(file.storage_path)} target="_blank" rel="noreferrer">{file.file_name}</a> : <span>{file.file_name} · menyiapkan tautan…</span>}</li>)}</ul></div>}
      </div>
    );
  }

  if (loading) return <p className="public-state" role="status">Memuat materi TKJ…</p>;
  if (error) return <div className="public-state public-error" role="alert"><p>{error}</p><button className="public-back" onClick={() => setRevision((value) => value + 1)} type="button">Coba lagi</button></div>;
  if (!supabase || lessons.length === 0) return <div className="public-state"><BookOpen size={25} /><p>Belum ada materi publik yang tersedia.</p>{supabase && <button className="public-back" type="button" onClick={() => setRevision((value) => value + 1)}>Muat ulang</button>}</div>;
  return <div className="public-lessons">{lessons.map((lesson, index) => <article className="public-lesson" key={lesson.id}><span className="public-lesson-index">{String(index + 1).padStart(2, '0')} / MATERI</span><h3>{lesson.title}</h3><p>{lesson.summary || 'Materi Teknik Komputer dan Jaringan'}</p><button type="button" onClick={() => setSelected(lesson)}>Baca materi <ArrowRight size={16} /></button></article>)}</div>;
}
