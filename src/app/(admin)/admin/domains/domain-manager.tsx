'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface CustomDomain {
  id: string;
  hostname: string;
  isPrimary: boolean;
  status: 'VERIFIED' | 'PENDING_VERIFICATION';
  verifiedAt?: string | null;
  createdAt?: string;
  verificationToken?: string;
}

interface DnsInstructions {
  recordType: string;
  host: string;
  value: string;
  alternativeCname?: {
    recordType: string;
    host: string;
    value: string;
  };
}

export function DomainManager() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [dnsModalData, setDnsModalData] = useState<{
    domain: CustomDomain;
    dnsInstructions: DnsInstructions;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/admin/domains');
      const list = Array.isArray(data) ? data : data?.domains || data?.data || [];
      setDomains(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load domains.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleanDomain) {
      setError('Please provide a valid domain name.');
      return;
    }

    setAdding(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await apiFetch<any>('/api/v1/admin/domains', {
        method: 'POST',
        body: JSON.stringify({ domainName: cleanDomain }),
      });

      setShowAddModal(false);
      setNewDomain('');
      setFeedback('Domain added. Please configure DNS TXT records to complete verification.');
      if (res?.dnsInstructions && res?.domain) {
        setDnsModalData({
          domain: res.domain,
          dnsInstructions: res.dnsInstructions,
        });
      }
      await loadDomains();
    } catch (err: any) {
      setError(err?.message || 'Failed to add custom domain.');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (id: string) => {
    setActionId(id);
    setError(null);
    setFeedback(null);
    try {
      const res = await apiFetch<any>(`/api/v1/admin/domains/${id}/verify`, {
        method: 'POST',
      });
      setFeedback(res?.message || 'Domain successfully verified!');
      await loadDomains();
    } catch (err: any) {
      setError(err?.message || 'Domain verification check failed. Ensure DNS TXT records have propagated.');
    } finally {
      setActionId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    setActionId(id);
    setError(null);
    setFeedback(null);
    try {
      const res = await apiFetch<any>(`/api/v1/admin/domains/${id}/primary`, {
        method: 'POST',
      });
      setFeedback(res?.message || 'Primary domain updated successfully.');
      await loadDomains();
    } catch (err: any) {
      setError(err?.message || 'Failed to set primary domain.');
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string, hostname: string) => {
    if (!confirm(`Are you sure you want to remove domain "${hostname}"?`)) return;
    setActionId(id);
    setError(null);
    setFeedback(null);
    try {
      await apiFetch(`/api/v1/admin/domains/${id}`, {
        method: 'DELETE',
      });
      setFeedback(`Domain "${hostname}" removed.`);
      await loadDomains();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove domain.');
    } finally {
      setActionId(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Custom Domain Setup
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect your institution&apos;s custom domain (e.g., <code className="text-blue-600 dark:text-blue-400">myschool.edu.bd</code>) with automatic TLS certificate provisioning.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Connect Domain
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

      {/* Domain Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading custom domains...
        </div>
      ) : domains.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">No custom domains connected yet.</p>
          <p className="text-xs text-slate-400 mt-1">Your website is currently accessible via its default platform subdomain.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Domain Hostname</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Primary</th>
                <th className="px-4 py-3">Connected On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {domains.map((dom) => (
                <tr key={dom.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {dom.hostname}
                      </span>
                      {dom.isPrimary && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                          Primary Domain
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {dom.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending Verification
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {dom.isPrimary ? (
                      <span className="text-xs text-slate-500 font-medium">Active Primary</span>
                    ) : dom.status === 'VERIFIED' ? (
                      <button
                        type="button"
                        disabled={actionId === dom.id}
                        onClick={() => handleSetPrimary(dom.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium underline disabled:opacity-50"
                      >
                        {actionId === dom.id ? 'Setting...' : 'Set as Primary'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Verify first</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {dom.createdAt ? new Date(dom.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {dom.status !== 'VERIFIED' && (
                      <button
                        type="button"
                        disabled={actionId === dom.id}
                        onClick={() => handleVerify(dom.id)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {actionId === dom.id ? 'Checking...' : 'Verify DNS'}
                      </button>
                    )}
                    {!dom.isPrimary && (
                      <button
                        type="button"
                        disabled={actionId === dom.id}
                        onClick={() => handleRemove(dom.id, dom.hostname)}
                        className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Connect Custom Domain
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Domain Hostname *
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. school.edu.bd or myschool.org"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter your apex domain or subdomain without http:// or trailing slashes.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {adding ? 'Connecting...' : 'Connect Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DNS Instructions Modal */}
      {dnsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                DNS Configuration Required
              </h3>
              <button
                onClick={() => setDnsModalData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Add the following TXT record in your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy) to prove domain ownership:
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Type:</span>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {dnsModalData.dnsInstructions.recordType}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Host / Name:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dnsModalData.dnsInstructions.host, 'host')}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    {copiedKey === 'host' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 break-all select-all">
                  {dnsModalData.dnsInstructions.host}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Value / Content:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dnsModalData.dnsInstructions.value, 'value')}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    {copiedKey === 'value' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200 break-all select-all">
                  {dnsModalData.dnsInstructions.value}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              DNS propagation can take a few minutes up to 24 hours. Once your DNS record is live, click &quot;Verify DNS&quot; in the domain table.
            </p>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDnsModalData(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

