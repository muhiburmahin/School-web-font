'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface StaffItem {
  id: string;
  nameEn: string;
  nameBn: string;
  designation?: string;
  department?: string;
  phone?: string;
  email?: string;
  status?: string;
  sortOrder?: number;
}

interface CommitteeItem {
  id: string;
  nameEn: string;
  nameBn: string;
  roleEn: string;
  roleBn: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
}

export function StaffManager() {
  const [activeTab, setActiveTab] = useState<'staff' | 'committee'>('staff');
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [committeeList, setCommitteeList] = useState<CommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Staff Form state
  const [staffForm, setStaffForm] = useState({
    nameEn: '',
    nameBn: '',
    designation: '',
    department: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    sortOrder: 0,
  });

  // Committee Form state
  const [committeeForm, setCommitteeForm] = useState({
    nameEn: '',
    nameBn: '',
    roleEn: '',
    roleBn: '',
    phone: '',
    email: '',
    sortOrder: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, committeeRes] = await Promise.all([
        apiFetch<any>('/api/v1/admin/staff').catch(() => []),
        apiFetch<any>('/api/v1/admin/staff/committee').catch(() => []),
      ]);

      const staff = Array.isArray(staffRes)
        ? staffRes
        : staffRes?.items || staffRes?.data || [];
      const committee = Array.isArray(committeeRes)
        ? committeeRes
        : committeeRes?.items || committeeRes?.data || [];

      setStaffList(staff);
      setCommitteeList(committee);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff/committee records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Staff CRUD
  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      if (editingId) {
        await apiFetch(`/api/v1/admin/staff/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(staffForm),
        });
        setFeedback('Staff member updated successfully.');
      } else {
        await apiFetch('/api/v1/admin/staff', {
          method: 'POST',
          body: JSON.stringify(staffForm),
        });
        setFeedback('Staff member added successfully.');
      }
      setShowStaffForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStaffDelete(id: string) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await apiFetch(`/api/v1/admin/staff/${id}`, { method: 'DELETE' });
      setFeedback('Staff member removed successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff member.');
    }
  }

  // Committee CRUD
  async function handleCommitteeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      if (editingId) {
        await apiFetch(`/api/v1/admin/staff/committee/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(committeeForm),
        });
        setFeedback('Committee member updated successfully.');
      } else {
        await apiFetch('/api/v1/admin/staff/committee', {
          method: 'POST',
          body: JSON.stringify(committeeForm),
        });
        setFeedback('Committee member added successfully.');
      }
      setShowCommitteeForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save committee member.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCommitteeDelete(id: string) {
    if (!confirm('Are you sure you want to delete this committee member?')) return;
    try {
      await apiFetch(`/api/v1/admin/staff/committee/${id}`, { method: 'DELETE' });
      setFeedback('Committee member removed successfully.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete committee member.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Governing Body</h1>
          <p className="text-sm text-slate-600">
            Manage teachers, administrative staff, and the managing committee.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'staff' && !showStaffForm && (
            <button
              onClick={() => {
                setEditingId(null);
                setStaffForm({
                  nameEn: '',
                  nameBn: '',
                  designation: '',
                  department: '',
                  phone: '',
                  email: '',
                  status: 'ACTIVE',
                  sortOrder: staffList.length + 1,
                });
                setShowStaffForm(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Teacher / Staff
            </button>
          )}
          {activeTab === 'committee' && !showCommitteeForm && (
            <button
              onClick={() => {
                setEditingId(null);
                setCommitteeForm({
                  nameEn: '',
                  nameBn: '',
                  roleEn: '',
                  roleBn: '',
                  phone: '',
                  email: '',
                  sortOrder: committeeList.length + 1,
                });
                setShowCommitteeForm(true);
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Add Committee Member
            </button>
          )}
        </div>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('staff')}
          className={`border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Teachers & Staff ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('committee')}
          className={`border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'committee'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Managing Committee ({committeeList.length})
        </button>
      </div>

      {/* Teacher Form */}
      {showStaffForm && activeTab === 'staff' && (
        <form onSubmit={handleStaffSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Teacher/Staff' : 'New Teacher/Staff'}
            </h2>
            <button
              type="button"
              onClick={() => setShowStaffForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Name (English) *</label>
              <input
                type="text"
                required
                value={staffForm.nameEn}
                onChange={(e) => setStaffForm({ ...staffForm, nameEn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">নাম (বাংলা) *</label>
              <input
                type="text"
                required
                value={staffForm.nameBn}
                onChange={(e) => setStaffForm({ ...staffForm, nameBn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Designation (পদবী)</label>
              <input
                type="text"
                value={staffForm.designation}
                onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                placeholder="Senior Assistant Teacher"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Department (বিভাগ)</label>
              <input
                type="text"
                value={staffForm.department}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                placeholder="Science"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowStaffForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      )}

      {/* Committee Form */}
      {showCommitteeForm && activeTab === 'committee' && (
        <form onSubmit={handleCommitteeSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Committee Member' : 'New Committee Member'}
            </h2>
            <button
              type="button"
              onClick={() => setShowCommitteeForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Name (English) *</label>
              <input
                type="text"
                required
                value={committeeForm.nameEn}
                onChange={(e) => setCommitteeForm({ ...committeeForm, nameEn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">নাম (বাংলা) *</label>
              <input
                type="text"
                required
                value={committeeForm.nameBn}
                onChange={(e) => setCommitteeForm({ ...committeeForm, nameBn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Role / Position (English) *</label>
              <input
                type="text"
                required
                value={committeeForm.roleEn}
                onChange={(e) => setCommitteeForm({ ...committeeForm, roleEn: e.target.value })}
                placeholder="President / Member Secretary"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">পদবী (বাংলা) *</label>
              <input
                type="text"
                required
                value={committeeForm.roleBn}
                onChange={(e) => setCommitteeForm({ ...committeeForm, roleBn: e.target.value })}
                placeholder="সভাপতি / সদস্য সচিব"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
              <input
                type="text"
                value={committeeForm.phone}
                onChange={(e) => setCommitteeForm({ ...committeeForm, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={committeeForm.email}
                onChange={(e) => setCommitteeForm({ ...committeeForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowCommitteeForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Committee Member'}
            </button>
          </div>
        </form>
      )}

      {/* Staff Table */}
      {activeTab === 'staff' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading teachers & staff...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No staff members added yet.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.nameEn}</div>
                      {s.nameBn && <div className="text-xs text-slate-500">{s.nameBn}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.designation || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{s.department || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>{s.phone || '—'}</div>
                      <div>{s.email || ''}</div>
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingId(s.id);
                          setStaffForm({
                            nameEn: s.nameEn,
                            nameBn: s.nameBn,
                            designation: s.designation || '',
                            department: s.department || '',
                            phone: s.phone || '',
                            email: s.email || '',
                            status: s.status || 'ACTIVE',
                            sortOrder: s.sortOrder || 0,
                          });
                          setShowStaffForm(true);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStaffDelete(s.id)}
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
      )}

      {/* Committee Table */}
      {activeTab === 'committee' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Committee Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Loading committee members...
                  </td>
                </tr>
              ) : committeeList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No committee members added yet.
                  </td>
                </tr>
              ) : (
                committeeList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.nameEn}</div>
                      {c.nameBn && <div className="text-xs text-slate-500">{c.nameBn}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{c.roleEn}</div>
                      {c.roleBn && <div className="text-xs text-slate-500">{c.roleBn}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>{c.phone || '—'}</div>
                      <div>{c.email || ''}</div>
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setCommitteeForm({
                            nameEn: c.nameEn,
                            nameBn: c.nameBn,
                            roleEn: c.roleEn,
                            roleBn: c.roleBn,
                            phone: c.phone || '',
                            email: c.email || '',
                            sortOrder: c.sortOrder || 0,
                          });
                          setShowCommitteeForm(true);
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCommitteeDelete(c.id)}
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
      )}
    </div>
  );
}
