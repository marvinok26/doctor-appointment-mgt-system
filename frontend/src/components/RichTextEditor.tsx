"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBold,
  faItalic,
  faListUl,
  faListOl,
} from "@fortawesome/free-solid-svg-icons";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
  placeholder?: string;
}

function ToolbarButton({
  icon,
  active,
  onClick,
  label,
}: {
  icon: IconDefinition;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-md px-2 py-1.5 text-sm ${
        active ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

/**
 * The one rich-text field in the app (Doctor.Bio — see PRINCIPLES.md §12 for why the shorter
 * Appointment.Reason/Notes fields don't get this treatment). Minimal Tiptap StarterKit toolbar:
 * bold, italic, bullet/ordered lists — enough for a professional bio, no heading levels or
 * embeds that would be overkill for a couple of paragraphs.
 */
export function RichTextEditor({ label, value, onChange, error, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2 text-slate-900 dark:text-slate-100 dark:prose-invert",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>}
      <div className={`rounded-lg border bg-white dark:bg-slate-900 ${error ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}>
        <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-1.5 dark:border-slate-800">
          <ToolbarButton
            icon={faBold}
            label="Bold"
            active={!!editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon={faItalic}
            label="Italic"
            active={!!editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon={faListUl}
            label="Bullet list"
            active={!!editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon={faListOl}
            label="Numbered list"
            active={!!editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
