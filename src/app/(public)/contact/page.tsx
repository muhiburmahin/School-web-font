import type { Metadata } from 'next';
import { getPublicTenantProfile } from '@/features/public/actions';
import { ContactForm } from './contact-form';
import { copy } from '@/i18n/server-copy';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicTenantProfile();
  const nameEn = profile?.nameEn || profile?.name || 'Institution';
  return {
    title: `Contact Us | ${nameEn}`,
    description: 'Get in touch with our school administration and campus office.',
  };
}

export default async function PublicContactPage() {
  const [profile, text] = await Promise.all([
    getPublicTenantProfile(),
    copy('contact'),
  ]);

  const nameEn = profile?.nameEn || 'Institution';
  const nameBn = profile?.nameBn;
  const email = profile?.contactEmail || profile?.email || 'office@school.edu.bd';
  const phone = profile?.contactPhone || profile?.phone || '+880 1700-000000';
  const address = profile?.addressEn || profile?.address || 'School Campus Address';

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Contact Us
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Have an inquiry or need assistance? Reach out to our administrative office.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{nameEn}</h2>
            {nameBn && <p className="text-sm text-slate-600 font-bengali">{nameBn}</p>}

            <div className="space-y-3 pt-2 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Campus Address</p>
                  <p className="text-slate-600 leading-relaxed">{address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Phone</p>
                  <p className="text-slate-600">{phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Email Address</p>
                  <p className="text-slate-600">{email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Send a Message</h2>
          <ContactForm text={text} />
        </div>
      </div>
    </div>
  );
}

