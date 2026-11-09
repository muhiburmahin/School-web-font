import React from 'react';
import Link from 'next/link';

interface PublicHomepageProps {
  profile: any;
  notices: any[];
  staff: any[];
  gallery: any[];
}

export function PublicHomepage({ profile, notices = [], staff = [], gallery = [] }: PublicHomepageProps) {
  const nameEn = profile?.nameEn || profile?.name || 'Educational Institution';
  const nameBn = profile?.nameBn || 'শিক্ষা প্রতিষ্ঠান';
  const address = profile?.addressEn || profile?.district || '';
  const principalMsg = profile?.principalMessage || 'Welcome to our official institutional website.';
  const eiin = profile?.eiin ? `EIIN: ${profile.eiin}` : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {profile?.logoUrl && (
              <img src={profile.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{nameEn}</h1>
              <p className="text-xs text-slate-600 font-bengali">{nameBn} {eiin && `• ${eiin}`}</p>
            </div>
          </div>
          <nav className="hidden space-x-6 text-sm font-medium text-slate-700 md:flex">
            <Link className="hover:text-blue-600 transition-colors" href="/">Home</Link>
            <Link className="hover:text-blue-600 transition-colors" href="/pages/about-us">About Us</Link>
            <Link className="hover:text-blue-600 transition-colors" href="/notices">Notices</Link>
            <Link className="hover:text-blue-600 transition-colors" href="/staff">Teachers &amp; Staff</Link>
            <Link className="hover:text-blue-600 transition-colors" href="/gallery">Gallery</Link>
            <Link className="hover:text-blue-600 transition-colors" href="/pages/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 border border-slate-300 rounded-lg transition-colors"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-16 sm:py-24 text-center text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold sm:text-5xl tracking-tight leading-tight">{nameEn}</h2>
          <p className="mt-4 text-lg text-blue-100 font-bengali">{nameBn}</p>
          {address && <p className="mt-2 text-sm text-blue-200">{address}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-colors" href="/notices">
              Latest Circulars &amp; Notices
            </Link>
            <Link className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-900 shadow-md hover:bg-slate-100 transition-colors" href="/pages/admission">
              Online Admission Info
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 lg:grid-cols-3 sm:px-6">
        {/* Left / Center: About & Notices */}
        <div className="space-y-8 lg:col-span-2">
          {/* Principal's Message Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Message from the Principal / Head of Institution</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{principalMsg}</p>
          </div>

          {/* Notice Board Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Notice Board</h3>
              <Link className="text-sm font-semibold text-blue-600 hover:underline" href="/notices">
                View All Notices →
              </Link>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No recent notices published.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notices.slice(0, 5).map((notice: any) => (
                  <div key={notice.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-50/60 p-2 rounded-lg transition-colors">
                    <div>
                      <Link className="font-medium text-slate-900 hover:text-blue-600" href={`/notices/${notice.id}`}>
                        {notice.titleEn || notice.title}
                      </Link>
                      {notice.titleBn && (
                        <p className="text-xs text-slate-500 font-bengali">{notice.titleBn}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(notice.createdAt || notice.publishedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Gallery Highlights */}
          {gallery.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Campus Gallery</h3>
                <Link className="text-sm font-semibold text-blue-600 hover:underline" href="/gallery">
                  View Full Gallery →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.slice(0, 6).map((item: any) => {
                  const imgUrl = item.coverUrl || item.publicUrl || item.url || (item.items?.[0]?.asset?.publicUrl);
                  return (
                    <div key={item.id} className="h-28 sm:h-36 rounded-lg bg-slate-100 overflow-hidden relative group">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.titleEn || item.title || 'Gallery item'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                          {item.titleEn || 'Photo'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Links & Info */}
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-blue-600 font-medium">
              <li><Link className="hover:underline flex items-center gap-1.5" href="/pages/about-us"><span>›</span> About Our Institution</Link></li>
              <li><Link className="hover:underline flex items-center gap-1.5" href="/staff"><span>›</span> Governing Body &amp; Teachers</Link></li>
              <li><Link className="hover:underline flex items-center gap-1.5" href="/gallery"><span>›</span> Photo Gallery</Link></li>
              <li><Link className="hover:underline flex items-center gap-1.5" href="/pages/admission"><span>›</span> Online Admission</Link></li>
              <li><Link className="hover:underline flex items-center gap-1.5" href="/external-links"><span>›</span> Government &amp; Board Links</Link></li>
              <li><Link className="hover:underline flex items-center gap-1.5" href="/pages/contact"><span>›</span> Contact &amp; Location</Link></li>
            </ul>
          </div>

          {/* Key Administration Preview */}
          {staff.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">Administration &amp; Faculty</h3>
              <div className="space-y-3">
                {staff.slice(0, 4).map((person: any) => (
                  <div key={person.id} className="flex items-center gap-3">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {(person.nameEn || person.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">
                        {person.nameEn || person.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {person.designationEn || person.designation || 'Faculty Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100">
                <Link href="/staff" className="text-xs font-semibold text-blue-600 hover:underline">
                  View All Staff Members →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p>© {new Date().getFullYear()} {nameEn}. All rights reserved.</p>
          <p className="mt-1">Powered by MRM InfoTech Multi-Institution Website Platform.</p>
        </div>
      </footer>
    </div>
  );
}

