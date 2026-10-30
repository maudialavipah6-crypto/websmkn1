import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

export default function ResponsiveSidebar({ children, className = '', label = 'Navigasi', breakpoint = 800, triggerTarget }) {
  const query = `(max-width: ${breakpoint}px)`;
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => { setMobile(media.matches); setOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  useEffect(() => {
    if (!open || !mobile) return undefined;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previous;
      trigger.current?.focus();
    };
  }, [open, mobile]);

  if (!mobile) return <aside className={className}>{children}</aside>;
  const menuButton = <button ref={trigger} className="drawer-trigger" type="button" aria-label={`Buka ${label}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}><Menu size={22} /><span>Menu</span></button>;
  return <>
    {triggerTarget === undefined ? menuButton : triggerTarget ? createPortal(menuButton, triggerTarget) : null}
    <dialog ref={dialog} className="mobile-drawer" aria-label={label} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="drawer-heading"><strong>{label}</strong><button autoFocus className="drawer-close" type="button" aria-label="Tutup menu" onClick={() => setOpen(false)}><X size={22} /></button></div>
      <div className={`drawer-content ${className}`} onClick={(event) => { if (event.target.closest('a, button')) setOpen(false); }}>{children}</div>
    </dialog>
  </>;
}
