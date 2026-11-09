import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicNoticeById } from '@/features/public/actions';

interface NoticeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const notice = await getPublicNoticeById(id);
  if (!notice) return { title: 'Notice Not Found' };
  return {
    title: `${notice.titleEn || notice.title} | Notice Board`,
    description: notice.titleBn || 'Official institutional circular and notice.',
  };
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  const notice = await getPublicNoticeById(id);

  if (!notice) {
    notFound();
  }

  const title = notice.titleEn || notice.title || 'Official Notice';
  const titleBn = notice.titleBn;
  const body = notice.content || notice.body || notice.summary || '';
  const dateStr = notice.publishedAt || notice.noticeDate || notice.createdAt;
  const attachmentUrl = notice.attachmentUrl || notice.fileUrl || notice.pdfUrl;

  return (
    <article className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <Link href="/notices" className="hover:underline flex items-center gap-1">
          <span>←</span> Back to Notice Board
        </Link>
      </div>

      <header className="space-y-3 pb-6 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {notice.category && (
            <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {notice.category?.nameEn || notice.category?.name || notice.category}
            </span>
          )}
          {notice.isPinned && (
            <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              Pinned Notice
            </span>
          )}
          {dateStr && (
            <span className="text-slate-500">
              Published: {new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {title}
        </h1>
        {titleBn && (
          <p className="text-lg text-slate-600 font-bengali">{titleBn}</p>
        )}
      </header>

      {body ? (
        <div className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed whitespace-pre-wrap py-4">
          {body}
        </div>
      ) : (
        <p className="text-slate-500 italic py-4">No textual description provided for this notice.</p>
      )}

      {attachmentUrl && (
        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Official Attachment / Document</p>
              <p className="text-xs text-slate-500">Click to preview or download the file</p>
            </div>
          </div>

          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Download Document
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        </div>
      )}
    </article>
  );
}

