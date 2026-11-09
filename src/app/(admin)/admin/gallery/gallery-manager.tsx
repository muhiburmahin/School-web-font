'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface AlbumItem {
  id: string;
  titleEn: string;
  titleBn: string;
  isPublished?: boolean;
  coverAssetId?: string;
  items?: Array<{
    id: string;
    assetId: string;
    captionEn?: string;
    captionBn?: string;
  }>;
  createdAt?: string;
}

export function GalleryManager({ text }: { text?: any } = {}) {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    titleEn: '',
    titleBn: '',
    isPublished: true,
  });

  const [itemForm, setItemForm] = useState({
    assetId: '',
    captionEn: '',
    captionBn: '',
  });

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/admin/gallery');
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setAlbums(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load gallery albums.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      if (editingId) {
        await apiFetch(`/api/v1/admin/gallery/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setFeedback('Album updated successfully.');
      } else {
        await apiFetch('/api/v1/admin/gallery', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setFeedback('Album created successfully.');
      }
      setShowForm(false);
      await loadAlbums();
    } catch (err: any) {
      setError(err.message || 'Failed to save album.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this album?')) return;
    try {
      await apiFetch(`/api/v1/admin/gallery/${id}`, { method: 'DELETE' });
      setFeedback('Album deleted successfully.');
      await loadAlbums();
    } catch (err: any) {
      setError(err.message || 'Failed to delete album.');
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAlbum) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/gallery/${selectedAlbum.id}/items`, {
        method: 'POST',
        body: JSON.stringify(itemForm),
      });
      setFeedback('Photo item added to album successfully.');
      setShowAddItemForm(false);
      setItemForm({ assetId: '', captionEn: '', captionBn: '' });
      await loadAlbums();
    } catch (err: any) {
      setError(err.message || 'Failed to add item to album.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Photo Gallery & Albums</h1>
          <p className="text-sm text-slate-600">
            Create photo albums, attach media library assets, and curate public galleries.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ titleEn: '', titleBn: '', isPublished: true });
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Create Album
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
              {editingId ? 'Edit Album' : 'New Photo Album'}
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
              <label className="mb-1 block text-xs font-medium text-slate-700">Album Title (English) *</label>
              <input
                type="text"
                required
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="Annual Sports & Cultural Day 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">অ্যালবাম নাম (বাংলা) *</label>
              <input
                type="text"
                required
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                placeholder="বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান ২০২৬"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="isPublished" className="text-sm text-slate-700">
                Visible on public website (প্রকাশিত)
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
              {saving ? 'Saving...' : editingId ? 'Update Album' : 'Create Album'}
            </button>
          </div>
        </form>
      )}

      {/* Add Item Modal */}
      {showAddItemForm && selectedAlbum && (
        <form onSubmit={handleAddItem} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Add Photo to &quot;{selectedAlbum.titleEn}&quot;
            </h2>
            <button
              type="button"
              onClick={() => setShowAddItemForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Media Asset UUID *</label>
              <input
                type="text"
                required
                value={itemForm.assetId}
                onChange={(e) => setItemForm({ ...itemForm, assetId: e.target.value })}
                placeholder="UUID from media library"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Caption (English)</label>
              <input
                type="text"
                value={itemForm.captionEn}
                onChange={(e) => setItemForm({ ...itemForm, captionEn: e.target.value })}
                placeholder="Prize Giving Ceremony"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">ক্যাপশন (বাংলা)</label>
              <input
                type="text"
                value={itemForm.captionBn}
                onChange={(e) => setItemForm({ ...itemForm, captionBn: e.target.value })}
                placeholder="পুরস্কার বিতরণী পর্ব"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddItemForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Attach Photo'}
            </button>
          </div>
        </form>
      )}

      {/* Albums Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm text-slate-500">
            Loading albums...
          </div>
        ) : albums.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No photo albums created yet. Click &quot;+ Create Album&quot; to begin.
          </div>
        ) : (
          albums.map((album) => (
            <div key={album.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">{album.titleEn}</h3>
                  {album.titleBn && <p className="text-xs text-slate-500">{album.titleBn}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  album.isPublished !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {album.isPublished !== false ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>{album.items?.length ?? 0} photos</span>
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      setSelectedAlbum(album);
                      setShowAddItemForm(true);
                    }}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    + Add Photo
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(album.id);
                      setForm({
                        titleEn: album.titleEn,
                        titleBn: album.titleBn,
                        isPublished: album.isPublished !== false,
                      });
                      setShowForm(true);
                    }}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(album.id)}
                    className="font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
