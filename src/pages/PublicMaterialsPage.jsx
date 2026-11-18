import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Play, Search } from 'lucide-react';
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
  const [search, setSearch] = useState('');
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

  const catalog = !lessonId && result?.data ? result.data : [];
  const query = search.trim().toLocaleLowerCase('id');
  const visibleLessons = catalog.filter(item => `${item.title} ${item.summary || ''}`.toLocaleLowerCase('id').includes(query));

  return (
    <div className="page-shell">
    <header className="material-topbar">
      <a className="brand-wrap" href="#beranda">
        <img className="brand-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt="" />
        <span className="brand-copy"><strong>SMKN 1 Garut</strong><span>Teknik Komputer dan Jaringan</span></span>
      </a>
      <nav aria-label="Navigasi materi">
        <a href="#beranda">Beranda</a>
        <a href={materialHref} aria-current={lessonId ? 'location' : 'page'}>Materi TKJ</a>
      </nav>
    </header>
    <main className="section material-page">
      <a className="public-back" href={lessonId ? materialHref : '#beranda'}>
        <ArrowLeft size={16} /> {lessonId ? 'Kembali ke Materi TKJ' : 'Kembali ke Beranda'}
      </a>
      {lesson ? (
        <article className="material-reader">
          <header className="material-reader-heading">
          <h1>{lesson.title}</h1>
          {lesson.summary && <p className="public-summary">{lesson.summary}</p>}
          </header>
          <div className="lesson-reader-content" dangerouslySetInnerHTML={{
            __html: renderLessonHtml(lesson.content, new Map(files.filter(file => file.url).map(file => [file.storage_path, file.url]))),
          }} />
          {videoId && <section className="material-resource" aria-labelledby="lesson-video-title">
            <h2 id="lesson-video-title">Video pembelajaran</h2>
            <LessonVideo id={videoId} title={`Video: ${lesson.title}`} />
          </section>}
          {assetError && <p className="public-error" role="alert">{assetError}</p>}
          {files.length > 0 && (
            <section className="public-downloads material-resource" aria-labelledby="lesson-files-title">
              <h2 id="lesson-files-title">Lampiran</h2>
              <ul>{files.map(file => (
                <li key={file.id}>
                  <FileText size={16} />
                  {file.url ? <a href={file.url} target="_blank" rel="noreferrer">{file.file_name}</a> : <span>{file.file_name}</span>}
                </li>
              ))}</ul>
            </section>
          )}
        </article>
      ) : (
        <>
          <header className="material-page-heading">
            <h1>Materi TKJ</h1>
            {!lessonId && <p>Modul Teknik Komputer dan Jaringan dari guru SMKN 1 Garut. Bisa dibaca tanpa login.</p>}
          </header>
          {!result && <p className="public-state" role="status">Memuat materi TKJ…</p>}
          {result?.error && <div className="public-state public-error" role="alert">
            <p>Materi belum dapat dimuat.</p>
            <button className="public-back" type="button" onClick={retry}>Coba lagi</button>
          </div>}
          {result && !result.error && lessonId && <p className="public-state">Materi tidak ditemukan atau belum diterbitkan.</p>}
          {result?.data?.length === 0 && !lessonId && <p className="public-state">Belum ada materi publik yang tersedia.</p>}
          {catalog.length > 0 && (
            <section className="material-catalog" aria-label="Daftar materi">
              <div className="material-catalog-bar">
                <p role="status">{query ? `${visibleLessons.length} dari ${catalog.length} materi` : `${catalog.length} materi tersedia`}</p>
                <label className="material-search">
                  <Search size={18} aria-hidden="true" />
                  <span className="sr-only">Cari materi</span>
                  <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari materi…" />
                </label>
              </div>
              {visibleLessons.length === 0 && <p className="public-state">Tidak ada materi yang cocok. Coba kata kunci lain.</p>}
              <ul className="material-list">
              {visibleLessons.map(item => (
                <li key={item.id}>
                  <a className="material-row" href={`${materialHref}/${item.id}`}>
                    <span className="material-row-icon"><BookOpen size={21} aria-hidden="true" /></span>
                    <div className="material-row-copy">
                      <h2>{item.title}</h2>
                      {item.summary && <p>{item.summary}</p>}
                      <div className="material-card-assets">
                        {youtubeId(item.video_url || '') && <span><Play size={13} aria-hidden="true" /> Video</span>}
                        {item.lesson_attachments?.some(file => file.mime_type === 'application/pdf') && <span><FileText size={13} aria-hidden="true" /> PDF</span>}
                      </div>
                    </div>
                    <ArrowRight className="material-row-arrow" size={20} aria-hidden="true" />
                  </a>
                </li>
              ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
    </div>
  );
}
