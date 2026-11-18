import { useCallback, useState } from 'react';
import { Play } from 'lucide-react';

export default function LessonVideo({ id, title = 'Video materi TKJ' }) {
  const [playing, setPlaying] = useState(false);
  const focusPlayer = useCallback(node => node?.focus(), []);
  return (
    <div className="lesson-video">
      {playing ? (
        <iframe
          ref={focusPlayer}
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)}>
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span><Play size={18} aria-hidden="true" /> Putar video</span>
        </button>
      )}
      <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer">Buka di YouTube</a>
    </div>
  );
}
