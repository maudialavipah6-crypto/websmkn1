import { ArrowLeft } from 'lucide-react';

export default function BackHomeLink({ className = '', inverse = false }) {
  const variant = inverse ? ' back-home-link--inverse' : '';

  return (
    <a className={`back-home-link${variant} ${className}`.trim()} href="#beranda">
      <span className="back-home-link-icon" aria-hidden="true"><ArrowLeft size={16} /></span>
      <span>Kembali ke Beranda</span>
    </a>
  );
}
