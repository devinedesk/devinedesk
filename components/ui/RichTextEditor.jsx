'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Type, Code, Strikethrough, Heading1, Heading2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ icon: Icon, onClick, isActive, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded transition-colors",
        isActive ? "text-white bg-primary/20" : "text-neutral-secondary hover:text-white hover:bg-white/10"
      )}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-neutral-border-glass bg-white/5 flex-wrap">
      <ToolbarButton
        icon={Bold}
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      />
      <ToolbarButton
        icon={Italic}
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      />
      <ToolbarButton
        icon={Strikethrough}
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      />
      
      <div className="w-px h-5 bg-neutral-border-glass mx-1" />
      
      <ToolbarButton
        icon={Heading1}
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      />
      <ToolbarButton
        icon={Heading2}
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      />
      <ToolbarButton
        icon={Type}
        title="Paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
      />
      
      <div className="w-px h-5 bg-neutral-border-glass mx-1" />
      
      <ToolbarButton
        icon={List}
        title="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      />
      <ToolbarButton
        icon={ListOrdered}
        title="Ordered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      />
      
      <div className="w-px h-5 bg-neutral-border-glass mx-1" />
      
      <ToolbarButton
        icon={Code}
        title="Code Block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
      />
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder = 'Type here...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] p-4 text-white text-sm outline-none overflow-y-auto prose prose-invert max-w-none focus:outline-none',
        placeholder: placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync value from props if it changes externally (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="w-full border border-neutral-border-glass rounded-xl overflow-hidden bg-neutral-card-bg focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
