'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/csrf-api';

export function ProfileThemeManager() {
  const [form, setForm] = useState({
    nameEn: '',
    nameBn: '',
    eiin: '',
    establishedYear: 1995,
    addressEn: '',
    addressBn: '',
    district: '',
    upazila: '',
    officialEmail: '',
    officialPhone: '',
    logoUrl: '',
    primaryColor: '#1d4ed8',
    secondaryColor: '#0f172a',
    actionColor: '#059669',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<any>('/api/v1/admin/institution-profile')
      .then((data) => {
        const p = data?.profile || data || {};
        const theme = p.theme || {};
        setForm({
          nameEn: p.nameEn || '',
          nameBn: p.nameBn || '',
          eiin: p.eiin || '',
          establishedYear: p.establishedYear || 1995,
          addressEn: p.addressEn || '',
          addressBn: p.addressBn || '',
          district: p.district || '',
          upazila: p.upazila || '',
          officialEmail: p.officialEmail || '',
          officialPhone: p.officialPhone || '',
          logoUrl: p.logoUrl || '',
          primaryColor: theme.primaryColor || p.primaryColor || '#1d4ed8',
          secondaryColor: theme.secondaryColor || p.secondaryColor || '#0f172a',
          actionColor: theme.actionColor || '#059669',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch('/api/v1/admin/institution-profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          establishedYear: Number(form.establishedYear),
        }),
      });
      setMessage('Institution profile and theme settings saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading institution profile...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Institution Profile & Theme Settings
        </h2>
        <p className="text-sm text-slate-600">
          Update bilingual institutional identity, contact info, and website color palette.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Name (English)</label>
          <input
            type="text"
            required
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">নাম (বাংলা)</label>
          <input
            type="text"
            required
            value={form.nameBn}
            onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">EIIN Number</label>
          <input
            type="text"
            value={form.eiin}
            onChange={(e) => setForm({ ...form, eiin: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Established Year</label>
          <input
            type="number"
            value={form.establishedYear}
            onChange={(e) => setForm({ ...form, establishedYear: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Official Email</label>
          <input
            type="email"
            value={form.officialEmail}
            onChange={(e) => setForm({ ...form, officialEmail: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Official Phone</label>
          <input
            type="text"
            value={form.officialPhone}
            onChange={(e) => setForm({ ...form, officialPhone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Address (English)</label>
          <input
            type="text"
            value={form.addressEn}
            onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">ঠিকানা (বাংলা)</label>
          <input
            type="text"
            value={form.addressBn}
            onChange={(e) => setForm({ ...form, addressBn: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Theme Color Palette</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Primary Color</label>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="h-10 w-full cursor-pointer rounded border border-slate-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Secondary Color</label>
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
              className="h-10 w-full cursor-pointer rounded border border-slate-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Accent / Action Color</label>
            <input
              type="color"
              value={form.actionColor}
              onChange={(e) => setForm({ ...form, actionColor: e.target.value })}
              className="h-10 w-full cursor-pointer rounded border border-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Profile & Theme'}
        </button>
      </div>
    </form>
  );
}

