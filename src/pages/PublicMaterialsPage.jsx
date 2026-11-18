import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import LessonVideo from '../components/LessonVideo';
import { supabase } from '../lib/supabase';
import { renderLessonHtml } from '../lib/lessonContent';
import { lessonVideoId, youtubeId } from '../lib/lessonVideo';

const materialHref = '#/materi';
const bucket = 'tkj-course-assets';

export default function PublicMaterialsPage({ lessonId }) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [files, setFiles] = useState([]);
  const [assetError, setAssetError] = useState('');
  const lesson = lessonId ? result?.data : null;
  const videoId = lesson ? lessonVideoId(lesson) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
        const published = columns => supabase.from('lessons').select(columns).eq('is_published', true);
        let response;
        if (lessonId) {
          if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(lessonId)) {
            if (active) setResult({ data: null });
            return;
          }
          response = await published('*').eq('id', lessonId).maybeSingle();
        } else {
          const columns = 'id, title, summary, lesson_attachments(mime_type)';
          response = await published(`${columns}, video_url`).order('created_at', { ascending: false });
          if (response.error?.code === '42703') {
            response = await published(columns).order('created_at', { ascending: false });
          }
        }
        if (response.error) throw response.error;
        if (active) setResult({ data: response.data });
      } catch {
        if (active) setResult({ error: true });
      }
    }
    void load();
    return () => { active = false; };
  }, [lessonId, revision]);

  useEffect(() => {
    if (!lesson || !supabase) return;
    let active = true;
    async function loadFiles() {
      const { data, error } = await supabase.from('lesson_attachments')
        .select('id, storage_path, file_name').eq('lesson_id', lesson.id).order('created_at');
      if (error) throw error;
      const signed = await Promise.allSettled(data.map(async file => {
        const { data: link, error: signError } = await supabase.storage.from(bucket)
          .createSignedUrl(file.storage_path, 3600);
        return { ...file, url: signError ? null : link?.signedUrl };
      }));
      if (!active) return;
      const loaded = signed.map((item, index) => item.status === 'fulfilled' ? item.value : data[index]);
      setFiles(loaded);
      if (loaded.some(file => !file.url)) setAssetError('Sebagian lampiran belum dapat dibuka.');
    }
    void loadFiles().catch(() => {
      if (active) setAssetError('Lampiran belum dapat dimuat. Teks materi tetap tersedia.');
    });
    return () => { active = false; };
  }, [lesson]);

  function retry() {
    setResult(null);
    setFiles([]);
    setAssetError('');
    setRevision(current => current + 1);
  }

  return (
    <main className="section learning-section material-page">
      <a className="public-back" href={lessonId ? materialHref : '#beranda'}>
        <ArrowLeft size={16} /> {lessonId ? 'Kembali ke Materi TKJ' : 'Kembali ke Beranda'}
      </a>
      {lesson ? (
        <article className="public-reader">
          <h1>{lesson.title}</h1>
          {lesson.summary && <p className="public-summary">{lesson.summary}</p>}
          <div className="lesson-reader-content" dangerouslySetInnerHTML={{
            __html: renderLessonHtml(lesson.content, new Map(files.filter(file => file.url).map(file => [file.storage_path, file.url]))),
          }} />
          {videoId && <LessonVideo id={videoId} title={`Video: ${lesson.title}`} />}
          {assetError && <p className="public-error" role="alert">{assetError}</p>}
          {files.length > 0 && (
            <div className="public-downloads">
              <h2>Lampiran</h2>
              <ul>{files.map(file => (
                <li key={file.id}>
                  <FileText size={16} />
                  {file.url ? <a href={file.url} target="_blank" rel="noreferrer">{file.file_name}</a> : <span>{file.file_name}</span>}
                </li>
              ))}</ul>
            </div>
          )}
        </article>
      ) : (
        <>
          <header className="material-page-heading">
            <h1>Materi TKJ</h1>
            {!lessonId && <p>Baca modul yang diterbitkan guru tanpa login.</p>}
          </header>
          {!result && <p className="public-state" role="status">Memuat materi TKJ…</p>}
          {result?.error && <div className="public-state public-error" role="alert">
            <p>Materi belum dapat dimuat.</p>
            <button className="public-back" type="button" onClick={retry}>Coba lagi</button>
          </div>}
          {result && !result.error && lessonId && <p className="public-state">Materi tidak ditemukan atau belum diterbitkan.</p>}
          {result?.data?.length === 0 && !lessonId && <p className="public-state">Belum ada materi publik yang tersedia.</p>}
          {!lessonId && result?.data?.length > 0 && (
            <div className="public-lessons">
              {result.data.map(item => (
                <article className="public-lesson" key={item.id}>
                  <h2>{item.title}</h2>
                  {item.summary && <p>{item.summary}</p>}
                  <div className="material-card-assets">
                    {youtubeId(item.video_url || '') && <span>Video</span>}
                    {item.lesson_attachments?.some(file => file.mime_type === 'application/pdf') && <span>PDF</span>}
                  </div>
                  <a className="inline-link" href={`${materialHref}/${item.id}`}>Baca materi <ArrowRight size={16} /></a>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
