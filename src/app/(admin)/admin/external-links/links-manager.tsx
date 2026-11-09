'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface ExternalLinkItem {
  id: string;
  titleEn?: string;
  titleBn?: string;
  labelEn?: string;
  labelBn?: string;
  url: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'GOVERNMENT', label: 'Government & Board' },
  { value: 'EMS_PORTAL', label: 'EMS / Student Portal' },
  { value: 'ADMISSION', label: 'Admission System' },
  { value: 'PAYMENT', label: 'Payment Gateway' },
  { value: 'SOCIAL', label: 'Social Media' },
  { value: 'OTHER', label: 'Other Useful Links' },
];

export function ExternalLinksManager() {
  const [links, setLinks] = useState<ExternalLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    titleEn: '',
    titleBn: '',
    url: '',
    category: 'GOVERNMENT',
    sortOrder: 0,
    isActive: true,
  });

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/admin/external-links');
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setLinks(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load external links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      titleEn: '',
      titleBn: '',
      url: '',
      category: 'GOVERNMENT',
      sortOrder: links.length + 1,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (item: ExternalLinkItem) => {
    setEditingId(item.id);
    setForm({
      titleEn: item.titleEn || item.labelEn || '',
      titleBn: item.titleBn || item.labelBn || '',
      url: item.url,
      category: item.category || 'OTHER',
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.startsWith('http://') && !form.url.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    setError(null);
    setFeedback(null);

    const payload = {
      titleEn: form.titleEn,
      titleBn: form.titleBn,
      labelEn: form.titleEn,
      labelBn: form.titleBn,
      url: form.url,
      category: form.category,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await apiFetch(`/api/v1/admin/external-links/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setFeedback('External link updated successfully.');
      } else {
        await apiFetch('/api/v1/admin/external-links', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedback('External link created successfully.');
      }
      setShowModal(false);
      await loadLinks();
    } catch (err: any) {
      setError(err?.message || 'Failed to save external link.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      await apiFetch(`/api/v1/admin/external-links/${id}`, { method: 'DELETE' });
      setFeedback('External link deleted successfully.');
      await loadLinks();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete external link.');
    }
  };

  const handleToggleActive = async (item: ExternalLinkItem) => {
    const nextActive = !item.isActive;
    try {
      await apiFetch(`/api/v1/admin/external-links/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titleEn: item.titleEn || item.labelEn,
          titleBn: item.titleBn || item.labelBn,
          url: item.url,
          category: item.category,
          sortOrder: item.sortOrder,
          isActive: nextActive,
        }),
      });
      setFeedback(`Link ${nextActive ? 'activated' : 'deactivated'}.`);
      await loadLinks();
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle status.');
    }
  };

  const filteredLinks = links.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Filter:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add External Link
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading external links...
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
          No external links found in this category.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Label (English / Bengali)</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredLinks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {item.sortOrder ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {item.titleEn || item.labelEn || 'Untitled'}
                    </div>
                    {item.titleBn || item.labelBn ? (
                      <div className="text-xs text-slate-500 font-bengali">
                        {item.titleBn || item.labelBn}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate font-mono text-xs text-blue-600 dark:text-blue-400">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>{item.url}</span>
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.category || 'OTHER'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingId ? 'Edit External Link' : 'Add External Link'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Label (English) *
                </label>
                <input
                  type="text"
                  required
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  placeholder="e.g. Education Board Results"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Label (Bengali)
                </label>
                <input
                  type="text"
                  value={form.titleBn}
                  onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                  placeholder="e.g. শিক্ষা বোর্ড ফলাফল"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GOVERNMENT">Government & Board</option>
                    <option value="EMS_PORTAL">EMS / Student Portal</option>
                    <option value="ADMISSION">Admission System</option>
                    <option value="PAYMENT">Payment Gateway</option>
                    <option value="SOCIAL">Social Media</option>
                    <option value="OTHER">Other Useful Links</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="link-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="link-active" className="text-sm text-slate-700 dark:text-slate-300">
                  Visible on public website (Active)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

