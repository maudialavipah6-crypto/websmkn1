import { Component } from 'react';

export default class LessonErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="dashboard-panel">
        <h2>Materi TKJ belum bisa dibuka</h2>
        <p role="alert">Coba buka kembali. Jika masih gagal, muat ulang halaman untuk mengambil versi terbaru.</p>
        <div className="lesson-form-actions">
          <button className="dashboard-primary" type="button" onClick={() => this.setState({ failed: false })}>Coba lagi</button>
          <button className="dashboard-primary" type="button" onClick={() => window.location.reload()}>Muat ulang halaman</button>
        </div>
      </section>
    );
  }
}
