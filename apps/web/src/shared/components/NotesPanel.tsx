import { useState } from 'react';
import { X, Trash2, Send } from 'lucide-react';
import {
  usePersonNotes,
  useCreatePersonNote,
  useDeletePersonNote,
  useProjectNotes,
  useCreateProjectNote,
  useDeleteProjectNote,
} from '@/shared/api/hooks';

interface NotesPanelProps {
  entityType: 'person' | 'project';
  entityId: string;
  entityName: string;
  open: boolean;
  onClose: () => void;
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NotesPanel({ entityType, entityId, entityName, open, onClose }: NotesPanelProps) {
  const [content, setContent] = useState('');

  // Use the right hooks based on entity type
  const personNotes = usePersonNotes(entityType === 'person' ? entityId : '');
  const projectNotes = useProjectNotes(entityType === 'project' ? entityId : '');
  const createPersonNote = useCreatePersonNote();
  const deletePersonNote = useDeletePersonNote();
  const createProjectNote = useCreateProjectNote();
  const deleteProjectNote = useDeleteProjectNote();

  const notes = entityType === 'person'
    ? (personNotes.data ?? [])
    : (projectNotes.data ?? []);

  const isLoading = entityType === 'person' ? personNotes.isLoading : projectNotes.isLoading;

  const handleAdd = async () => {
    if (!content.trim()) return;
    if (entityType === 'person') {
      await createPersonNote.mutateAsync({ personId: entityId, content: content.trim() });
    } else {
      await createProjectNote.mutateAsync({ projectId: entityId, content: content.trim() });
    }
    setContent('');
  };

  const handleDelete = (noteId: string) => {
    if (entityType === 'person') {
      deletePersonNote.mutate({ personId: entityId, noteId });
    } else {
      deleteProjectNote.mutate({ projectId: entityId, noteId });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes &mdash; {entityName}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {[...notes].reverse().map((note) => (
                <div key={note.id} className="group rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatRelative(note.createdAt)}</span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="invisible rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:visible"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note form */}
        <div className="border-t border-gray-200 px-5 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Ctrl+Enter to send</p>
        </div>
      </div>
    </div>
  );
}
