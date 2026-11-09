'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface OverviewStats {
  institutions: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    rejected?: number;
  };
  totalInstitutionAdmins: number;
}

export function PlatformDashboardClient() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const [overviewRes, listRes] = await Promise.all([
        apiFetch<OverviewStats>('/api/v1/platform/overview').catch(() => null),
        apiFetch<{ items?: any[]; data?: any[] }>(
          `/api/v1/platform/institutions?${params.toString()}`,
        ),
      ]);

      if (overviewRes) setOverview(overviewRes);
      const list = Array.isArray(listRes)
        ? listRes
        : listRes?.items || listRes?.data || [];
      setInstitutions(list);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to load platform data.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/v1/platform/institutions/${id}/approve`, {
        method: 'POST',
      });
      setFeedback(res.message || 'Institution approved and website provisioned!');
      await loadData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve institution.');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStatusChange(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') {
    setActionLoadingId(id);
    setFeedback(null);
    try {
      const res = await apiFetch<{ message?: string }>(`/api/v1/platform/institutions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setFeedback(res.message || `Status updated to ${status}`);
      await loadData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            MRM InfoTech — Super Admin Control Panel
          </h1>
          <p className="text-sm text-slate-600">
            Approve new registrations, provision websites, and monitor tenant institutions.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {feedback}
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-500">Total Institutions</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {overview.institutions?.total ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-medium text-amber-800">Pending Approval</div>
            <div className="mt-1 text-2xl font-bold text-amber-900">
              {overview.institutions?.pending ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-medium text-emerald-800">Active Websites</div>
            <div className="mt-1 text-2xl font-bold text-emerald-900">
              {overview.institutions?.active ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-xs font-medium text-rose-800">Suspended</div>
            <div className="mt-1 text-2xl font-bold text-rose-900">
              {overview.institutions?.suspended ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-500">Institution Admins</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {overview.totalInstitutionAdmins ?? 0}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by institution name, slug, email..."
          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Subdomain Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Onboarding</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading institutions...
                </td>
              </tr>
            ) : institutions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No institutions found.
                </td>
              </tr>
            ) : (
              institutions.map((inst) => {
                const nameEn = inst.profile?.nameEn || inst.nameEn || inst.siteSlug;
                const nameBn = inst.profile?.nameBn || inst.nameBn || '';
                const slug = inst.siteSlug || inst.slug;
                const isBusy = actionLoadingId === inst.id;

                return (
                  <tr key={inst.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{nameEn}</div>
                      {nameBn && <div className="text-xs text-slate-500">{nameBn}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{slug}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {inst.onboardingStatus || 'READY'}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      {(inst.status !== 'ACTIVE' ||
                        inst.onboardingStatus === 'NEEDS_REVIEW' ||
                        inst.onboardingStatus === 'PENDING_SETUP') && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleApprove(inst.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve & Provision
                        </button>
                      )}
                      {inst.status === 'ACTIVE' && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleStatusChange(inst.id, 'SUSPENDED')}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      {inst.status === 'SUSPENDED' && (
                        <button
                          disabled={isBusy}
                          onClick={() => handleApprove(inst.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Re-Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

