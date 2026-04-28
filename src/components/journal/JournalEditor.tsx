import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useUiMode } from "@/store/useUiMode";
import { todayISO, workoutForDate } from "@/lib/date";
import { promptForDate } from "@/lib/prompts";
import { legacyTextToHtml, isEmptyHtml } from "@/lib/journalContent";
import { EntryHeader } from "@/components/journal/EntryHeader";
import { FloatingToolbar } from "@/components/journal/FloatingToolbar";
import { Button } from "@/components/ui/button";
import { parseISO } from "date-fns";

const SAVE_DEBOUNCE_MS = 500;

export function JournalEditor() {
  const selectedDateISO = useUiMode((s) => s.selectedDateISO);
  const setSelectedDate = useUiMode((s) => s.setSelectedDate);

  if (!selectedDateISO) {
    return <EmptyState onNewEntry={() => setSelectedDate(todayISO())} />;
  }

  return <ActiveEditor dateISO={selectedDateISO} />;
}

function EmptyState({ onNewEntry }: { onNewEntry: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-[120px]">
      <div className="flex max-w-[440px] flex-col items-center gap-4 text-center text-black">
        <p className="text-lg leading-relaxed text-black/70">
          Select a run from the right to start journaling, or start a new entry.
        </p>
        <Button onClick={onNewEntry}>New entry for today</Button>
      </div>
    </div>
  );
}

function ActiveEditor({ dateISO }: { dateISO: string }) {
  const date = useMemo(() => parseISO(dateISO), [dateISO]);

  const hydrated = useEntries((s) => s.hydrated);
  const upsert = useEntries((s) => s.upsert);
  const plan = usePlan((s) => s.plan);
  const workout = useMemo(() => workoutForDate(plan, dateISO), [plan, dateISO]);

  const prevDateRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [empty, setEmpty] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    autofocus: true,
    editorProps: {
      attributes: {
        class:
          "rj-prose w-full max-w-[856px] mx-[120px] mt-10 mb-24 text-black outline-none focus:outline-none",
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    if (!hydrated || !editor) return;

    const prev = prevDateRef.current;
    if (prev !== null && prev !== dateISO) {
      void upsert({
        dateISO: prev,
        workoutId: workoutForDate(plan, prev)?.id,
        body: editor.getHTML(),
        updatedAt: new Date().toISOString(),
      });
    }

    const nextBody = useEntries.getState().entries[dateISO]?.body ?? "";
    editor.commands.setContent(legacyTextToHtml(nextBody), { emitUpdate: false });
    setEmpty(isEmptyHtml(editor.getHTML()));
    prevDateRef.current = dateISO;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, dateISO, editor]);

  useEffect(() => {
    if (!editor || !hydrated) return;
    const handler = () => {
      setEmpty(isEmptyHtml(editor.getHTML()));
      if (prevDateRef.current !== dateISO) return;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        void upsert({
          dateISO,
          workoutId: workout?.id,
          body: editor.getHTML(),
          updatedAt: new Date().toISOString(),
        });
      }, SAVE_DEBOUNCE_MS);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [editor, hydrated, dateISO, workout?.id, upsert]);

  const placeholder = promptForDate(dateISO);

  return (
    <div className="flex h-full flex-col chrome-group">
      <div className="px-[120px] pt-[86px]">
        <EntryHeader date={date} workout={workout} />
      </div>
      <div
        className="relative flex flex-1 min-h-0 flex-col overflow-y-auto"
        style={{
          fontSize: "var(--rj-font-size, 20px)",
          lineHeight: 1.6,
        }}
      >
        {editor && <EditorContent editor={editor} />}
        {empty && (
          <p
            aria-hidden
            className="pointer-events-none absolute left-[120px] right-[120px] top-10 max-w-[856px] text-black opacity-60"
          >
            {placeholder}
          </p>
        )}
        {editor && (
          <BubbleMenu editor={editor}>
            <FloatingToolbar editor={editor} />
          </BubbleMenu>
        )}
      </div>
    </div>
  );
}
