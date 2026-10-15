import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  Bold,
  FileText,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';

const LessonImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetPath: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-asset-path'),
        renderHTML: ({ assetPath }) => assetPath ? { 'data-asset-path': assetPath } : {},
      },
      assetId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-asset-id'),
        renderHTML: ({ assetId }) => assetId ? { 'data-asset-id': assetId } : {},
      },
    };
  },
});

function ToolbarButton({ label, active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function RichTextEditor({
  content,
  onChange,
  onStageFiles,
  stagedAssets,
  onRemoveStagedAsset,
  disabled = false,
}) {
  const [assetError, setAssetError] = useState('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      LessonImage.configure({ inline: false, allowBase64: false }),
    ],
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'rich-text-content',
        'aria-label': 'Isi materi TKJ',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  }, [disabled]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content || '<p></p>');
  }, [content, editor]);

  async function stageImage(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setAssetError('');

    try {
      const [asset] = await onStageFiles([file]);
      editor?.chain().focus().setImage({
        src: asset.previewUrl,
        alt: file.name,
        assetId: asset.id,
      }).run();
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : 'Gambar tidak dapat ditambahkan.');
    }
  }

  async function stageAttachments(event) {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (files.length === 0) return;
    setAssetError('');

    try {
      await onStageFiles(files);
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : 'Lampiran tidak dapat ditambahkan.');
    }
  }

  function addLink() {
    if (!editor) return;
    const currentHref = editor.getAttributes('link').href;
    const href = window.prompt('Masukkan alamat tautan (https://...)', currentHref || 'https://');
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }

  function removeAsset(assetId) {
    const transaction = editor.state.tr;
    const positions = [];
    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'image' && node.attrs.assetId === assetId) positions.push(position);
    });
    positions.reverse().forEach((position) => {
      transaction.delete(position, position + 1);
    });
    if (positions.length > 0) editor.view.dispatch(transaction);
    onRemoveStagedAsset(assetId);
  }

  if (!editor) return <div className="rich-text-loading" aria-live="polite">Menyiapkan editor materi…</div>;

  return (
    <div className={`rich-text-editor${disabled ? ' is-disabled' : ''}`}>
      <div className="rich-text-toolbar" role="toolbar" aria-label="Pemformatan materi">
        <ToolbarButton label="Tebal" active={editor.isActive('bold')} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
        <ToolbarButton label="Miring" active={editor.isActive('italic')} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
        <ToolbarButton label="Subjudul" active={editor.isActive('heading', { level: 2 })} disabled={disabled} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></ToolbarButton>
        <ToolbarButton label="Daftar berpoin" active={editor.isActive('bulletList')} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
        <ToolbarButton label="Daftar bernomor" active={editor.isActive('orderedList')} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
        <ToolbarButton label="Kutipan" active={editor.isActive('blockquote')} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
        <ToolbarButton label="Tambah atau ubah tautan" active={editor.isActive('link')} disabled={disabled} onClick={addLink}><Link2 size={16} /></ToolbarButton>
        <span className="rich-text-toolbar-spacer" />
        <ToolbarButton label="Urungkan" disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
        <ToolbarButton label="Ulangi" disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
        <label className={`rich-text-upload${disabled ? ' is-disabled' : ''}`} title="Sisipkan gambar">
          <ImagePlus size={16} /><span className="sr-only">Sisipkan gambar</span>
          <input accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={stageImage} type="file" />
        </label>
      </div>
      <EditorContent editor={editor} />
      <div className="rich-text-footer">
        <span>Format, daftar, tautan, dan gambar TKJ. Gunakan gambar JPEG, PNG, atau WebP (maks. 10 MB).</span>
        <label className={`rich-text-attachment-button${disabled ? ' is-disabled' : ''}`}>
          <FileText size={15} /> Lampirkan gambar / PDF
          <input
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={disabled}
            multiple
            onChange={stageAttachments}
            type="file"
          />
        </label>
      </div>
      {assetError && <p className="editor-error" role="alert">{assetError}</p>}
      {stagedAssets.length > 0 && (
        <ul className="staged-asset-list" aria-label="Lampiran yang akan disimpan">
          {stagedAssets.map((asset) => (
            <li key={asset.id}>
              {asset.mime_type.startsWith('image/') ? <ImagePlus size={15} /> : <FileText size={15} />}
              <span>{asset.file_name}</span>
              <button type="button" aria-label={`Hapus lampiran ${asset.file_name}`} onClick={() => removeAsset(asset.id)}>Hapus</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RichTextEditor;
