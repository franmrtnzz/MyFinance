import { useEffect, useState } from 'react';
import { db } from '../database/db';
import type { Note } from '../database/db';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    try {
      const all = await db.notes.orderBy('createdAt').reverse().toArray();
      setNotes(all);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (input: { title: string; content: string; reminderDate?: string }) => {
    const now = new Date();
    const id = await db.notes.add({
      title: input.title.trim(),
      content: input.content.trim(),
      reminderDate: input.reminderDate,
      createdAt: now,
      updatedAt: now,
    });
    await loadNotes();
    // Backup en Supabase
    try {
      const deviceId = getDeviceId();
      await supabase.from('notes').insert({
        user_id: deviceId,
        title: input.title.trim(),
        content: input.content.trim(),
        reminder_date: input.reminderDate || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    } catch (e) {
      console.warn('Backup notas (insert) fallido, se ignora:', e);
    }
    return id;
  };

  const updateNote = async (id: number, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    const existing = await db.notes.get(id);
    const now = new Date();
    await db.notes.update(id, { ...updates, updatedAt: now });
    await loadNotes();
    // Backup en Supabase (reemplazar por created_at)
    try {
      if (existing?.createdAt) {
        const deviceId = getDeviceId();
        // Borrado + inserción para mantener idempotencia simple
        await supabase
          .from('notes')
          .delete()
          .eq('user_id', deviceId)
          .eq('created_at', existing.createdAt.toISOString());
        await supabase.from('notes').insert({
          user_id: deviceId,
          title: updates.title ?? existing.title,
          content: updates.content ?? existing.content,
          reminder_date: (updates.reminderDate ?? existing.reminderDate) || null,
          created_at: existing.createdAt.toISOString(),
          updated_at: now.toISOString(),
        });
      }
    } catch (e) {
      console.warn('Backup notas (update) fallido, se ignora:', e);
    }
  };

  const deleteNote = async (id: number) => {
    const existing = await db.notes.get(id);
    await db.notes.delete(id);
    await loadNotes();
    // Backup en Supabase
    try {
      if (existing?.createdAt) {
        const deviceId = getDeviceId();
        await supabase
          .from('notes')
          .delete()
          .eq('user_id', deviceId)
          .eq('created_at', existing.createdAt.toISOString());
      }
    } catch (e) {
      console.warn('Backup notas (delete) fallido, se ignora:', e);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  return { notes, loading, addNote, updateNote, deleteNote, refreshNotes: loadNotes };
};
