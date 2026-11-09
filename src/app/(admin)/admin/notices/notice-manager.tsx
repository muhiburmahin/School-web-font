'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface NoticeItem {
  id: string;
  titleEn?: string;
  titleBn?: string;
  title?: string;
  contentEn?: string;
  contentBn?: string;
  summary?: string;
  categoryId?: string;
  category?: { id: string; nameEn?: string; nameBn?: string };
  isPinned?: boolean;
  isPublished?: boolean;
  status?: string;
  attachmentUrl?: string;
  createdAt?: string;
  publishedAt?: string;
}

export function NoticeManager() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    titleEn: '',
    titleBn: '',
    contentEn: '',
    contentBn: '',
    categoryId: '',
    attachmentUrl: '',
    isPinned: false,
    isPublished: true,
  });

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/admin/notices');
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setNotices(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  function startCreate() {
    setEditingId(null);
    setForm({
      titleEn: '',
      titleBn: '',
      contentEn: '',
      contentBn: '',
      categoryId: notices[0]?.categoryId || '00000000-0000-0000-0000-000000000000',
      attachmentUrl: '',
      isPinned: false,
      isPublished: true,
    });
    setShowForm(true);
  }

  function startEdit(notice: NoticeItem) {
    setEditingId(notice.id);
    setForm({
      titleEn: notice.titleEn || notice.title || '',
      titleBn: notice.titleBn || notice.title || '',
      contentEn: notice.contentEn || notice.summary || '',
      contentBn: notice.contentBn || notice.summary || '',
      categoryId: notice.categoryId || '00000000-0000-0000-0000-000000000000',
      attachmentUrl: notice.attachmentUrl || '',
      isPinned: notice.isPinned ?? false,
      isPublished: notice.isPublished ?? notice.status === 'PUBLISHED',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);

    try {
      const payload = {
        titleEn: form.titleEn,
        titleBn: form.titleBn || form.titleEn,
        contentEn: form.contentEn,
        contentBn: form.contentBn || form.contentEn,
        categoryId: form.categoryId || undefined,
        attachmentUrl: form.attachmentUrl || undefined,
        isPinned: form.isPinned,
        isPublished: form.isPublished,
      };

      if (editingId) {
        await apiFetch(`/api/v1/admin/notices/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setFeedback('Notice updated successfully.');
      } else {
        await apiFetch('/api/v1/admin/notices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedback('Notice created successfully.');
      }

      setShowForm(false);
      await loadNotices();
    } catch (err: any) {
      setError(err.message || 'Failed to save notice.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await apiFetch(`/api/v1/admin/notices/${id}`, { method: 'DELETE' });
      setFeedback('Notice deleted successfully.');
      await loadNotices();
    } catch (err: any) {
      setError(err.message || 'Failed to delete notice.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notices Management</h1>
          <p className="text-sm text-slate-600">
            Create, pin, and publish institutional notices for public visitors and students.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Create Notice
          </button>
        )}
      </div>

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Notice' : 'New Notice'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Title (English) *</label>
              <input
                type="text"
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Annual Sports Day 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">শিরোনাম (বাংলা) *</label>
              <input
                type="text"
                required
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                placeholder="বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Content (English) *</label>
              <textarea
                required
                rows={3}
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                placeholder="Detailed notice information in English..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">বিবরণ (বাংলা) *</label>
              <textarea
                required
                rows={3}
                value={form.contentBn}
                onChange={(e) => setForm({ ...form, contentBn: e.target.value })}
                placeholder="বিস্তারিত নোটিশের তথ্য বাংলায়..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Attachment / PDF URL (Optional)</label>
              <input
                type="text"
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://.../notice.pdf"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                Pin to Top (গুরুত্বপূর্ণ)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                Published (প্রকাশিত)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Notice' : 'Publish Notice'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pinned</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading notices...
                </td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No notices published yet.
                </td>
              </tr>
            ) : (
              notices.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{n.titleEn || n.title}</div>
                    {n.titleBn && <div className="text-xs text-slate-500">{n.titleBn}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      n.isPublished ?? n.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {n.isPublished ?? n.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {n.isPinned ? (
                      <span className="font-semibold text-amber-600">📌 Pinned</span>
                    ) : (
                      <span className="text-slate-400">Regular</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(n)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
