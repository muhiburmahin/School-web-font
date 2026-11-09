'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/csrf-api';

interface MediaItem {
  id: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  sizeBytes?: number;
  url?: string;
  publicUrl?: string;
  folder?: string;
  kind?: string;
  createdAt?: string;
}

export function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/v1/admin/media');
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setMedia(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load media assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (file: File) => {
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', file);

    const queryFolder = uploadFolder ? `?folder=${encodeURIComponent(uploadFolder)}` : '';

    try {
      await apiFetch(`/api/v1/admin/media/upload${queryFolder}`, {
        method: 'POST',
        body: formData,
      });

      setFeedback(`File "${file.name}" uploaded successfully.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadMedia();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this media asset?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/v1/admin/media/${id}`, { method: 'DELETE' });
      setFeedback('Media asset deleted.');
      await loadMedia();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete asset.');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Unique folders list
  const folders = Array.from(
    new Set(
      media
        .map((m) => m.folder || 'general')
        .filter(Boolean),
    ),
  );

  const filteredMedia = media.filter((item) => {
    const matchesFolder =
      selectedFolder === 'all' || (item.folder || 'general') === selectedFolder;
    const name = item.originalName || item.filename || '';
    const matchesSearch =
      !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Upload New Media
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload images, banners, or documents (Max: 10MB)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Target Folder:
            </label>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">general</option>
              <option value="banners">banners</option>
              <option value="notices">notices</option>
              <option value="staff">staff</option>
              <option value="gallery">gallery</option>
              <option value="documents">documents</option>
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploading
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 pointer-events-none'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            accept="image/*,application/pdf"
          />
          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Uploading file to storage...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Drag and drop your file here, or{' '}
                <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP, GIF, PDF up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-xs underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Folder:
          </label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Folders ({media.length})</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading media assets...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
          No media files found {selectedFolder !== 'all' ? `in folder "${selectedFolder}"` : ''}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => {
            const url = item.publicUrl || item.url || '';
            const filename = item.originalName || item.filename || 'Untitled';
            const isImage = item.mimeType?.startsWith('image/') || url.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i);

            return (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-blue-400 transition-all"
              >
                {/* Thumbnail Preview */}
                <div className="h-40 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={url}
                      alt={filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-12 h-12 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-mono uppercase">{item.mimeType?.split('/')[1] || 'FILE'}</span>
                    </div>
                  )}

                  {/* Folder Tag */}
                  <div className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] uppercase font-semibold px-2 py-0.5 rounded">
                    {item.folder || 'general'}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate"
                      title={filename}
                    >
                      {filename}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatFileSize(item.sizeBytes || item.fileSize)}
                      {item.createdAt && ` • ${new Date(item.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(url, item.id)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      {copiedId === item.id ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy URL
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium disabled:opacity-50"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

