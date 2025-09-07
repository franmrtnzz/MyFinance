import React, { useState } from 'react';
import { Calendar, Trash2, Save } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';

export const NotesPage: React.FC = () => {
  const { notes, addNote, deleteNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    try {
      await addNote({ title, content, reminderDate: reminderDate || undefined });
      setTitle('');
      setContent('');
      setReminderDate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Notas y recordatorios</h2>

      <form onSubmit={handleAdd} className="space-y-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota o recordatorio..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || (!title.trim() && !content.trim())}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300"
          >
            <Save className="w-4 h-4 inline mr-2" /> Guardar
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Sin notas todavía</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
              <div className="pr-3">
                {n.title && <p className="font-semibold text-gray-800">{n.title}</p>}
                <p className="text-gray-700 whitespace-pre-wrap">{n.content}</p>
                {n.reminderDate && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Calendar className="w-3 h-3 inline mr-1" />{' '}
                    {new Date(n.reminderDate).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
              <button
                onClick={() => n.id && deleteNote(n.id)}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Borrar nota"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
