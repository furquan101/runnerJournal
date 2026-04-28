import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  ListOrdered,
  List,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ToolName = "bold" | "italic" | "strike" | "code" | "orderedList" | "bulletList" | "blockquote";

type Tool = {
  name: ToolName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  run: (editor: Editor) => void;
  can: (editor: Editor) => boolean;
};

const TOOLS: Tool[] = [
  {
    name: "bold",
    label: "Bold",
    icon: Bold,
    run: (e) => e.chain().focus().toggleBold().run(),
    can: (e) => e.can().chain().focus().toggleBold().run(),
  },
  {
    name: "italic",
    label: "Italic",
    icon: Italic,
    run: (e) => e.chain().focus().toggleItalic().run(),
    can: (e) => e.can().chain().focus().toggleItalic().run(),
  },
  {
    name: "strike",
    label: "Strikethrough",
    icon: Strikethrough,
    run: (e) => e.chain().focus().toggleStrike().run(),
    can: (e) => e.can().chain().focus().toggleStrike().run(),
  },
  {
    name: "code",
    label: "Inline code",
    icon: Code,
    run: (e) => e.chain().focus().toggleCode().run(),
    can: (e) => e.can().chain().focus().toggleCode().run(),
  },
  {
    name: "orderedList",
    label: "Ordered list",
    icon: ListOrdered,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    can: (e) => e.can().chain().focus().toggleOrderedList().run(),
  },
  {
    name: "bulletList",
    label: "Bulleted list",
    icon: List,
    run: (e) => e.chain().focus().toggleBulletList().run(),
    can: (e) => e.can().chain().focus().toggleBulletList().run(),
  },
  {
    name: "blockquote",
    label: "Quote",
    icon: Quote,
    run: (e) => e.chain().focus().toggleBlockquote().run(),
    can: (e) => e.can().chain().focus().toggleBlockquote().run(),
  },
];

export function FloatingToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white px-2 py-1.5 shadow-md">
      {TOOLS.map((tool) => {
        const active = editor.isActive(tool.name);
        const enabled = tool.can(editor);
        const Icon = tool.icon;
        return (
          <button
            key={tool.name}
            type="button"
            aria-label={tool.label}
            aria-pressed={active}
            disabled={!enabled}
            onMouseDown={(e) => {
              e.preventDefault();
              if (enabled) tool.run(editor);
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-black transition",
              active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100",
              !enabled && "opacity-30 hover:bg-transparent",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
