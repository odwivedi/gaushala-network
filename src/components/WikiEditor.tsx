'use client';
import logger from '@/lib/logger';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface WikiEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

export default function WikiEditor({ initialContent, onChange, editable = true }: WikiEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    onCreate() {
      logger.info('UI', 'WikiEditor.tsx', 'Editor initialised', { editable });
    },
  });

  if (!editor) return null;

  return (
    <div className="wiki-editor">
      {editable && (
        <div className="toolbar">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}>B</button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}>I</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}>H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}>H3</button>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}>• List</button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}>1. List</button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'active' : ''}>&quot; Quote</button>
          <button type="button" onClick={() => editor.chain().focus().undo().run()}>↩ Undo</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()}>↪ Redo</button>
        </div>
      )}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
