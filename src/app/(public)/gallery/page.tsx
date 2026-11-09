import type { Metadata } from 'next';
import { getPublicGallery, getPublicTenantProfile } from '@/features/public/actions';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicTenantProfile();
  const nameEn = profile?.nameEn || profile?.name || 'Institution';
  return {
    title: `Photo Gallery | ${nameEn}`,
    description: 'Explore photo albums and campus event galleries.',
  };
}

export default async function PublicGalleryPage() {
  const [gallery, profile] = await Promise.all([
    getPublicGallery(),
    getPublicTenantProfile(),
  ]);

  const albums = Array.isArray(gallery) ? gallery : [];

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Photo Gallery &amp; Campus Life
        </h1>
        <p className="text-sm text-slate-500">
          Memories, celebrations, academic achievements, and campus activities at {profile?.nameEn || 'our institution'}.
        </p>
      </div>

      {albums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          No photo albums have been published yet.
        </div>
      ) : (
        <div className="space-y-12">
          {albums.map((album: any) => {
            const items = Array.isArray(album.items) ? album.items : [];
            return (
              <div key={album.id} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {album.titleEn || album.title || 'Campus Album'}
                  </h2>
                  {album.titleBn && (
                    <p className="text-sm text-slate-600 font-bengali">{album.titleBn}</p>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No photos in this album yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item: any) => {
                      const src = item.publicUrl || item.asset?.publicUrl || item.url;
                      if (!src) return null;
                      return (
                        <div
                          key={item.id}
                          className="group relative h-48 sm:h-56 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200"
                        >
                          <img
                            src={src}
                            alt={item.captionEn || album.titleEn || 'Campus photo'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {(item.captionEn || item.captionBn) && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white text-xs">
                              <p className="font-medium truncate">{item.captionEn}</p>
                              {item.captionBn && (
                                <p className="text-[10px] text-slate-300 font-bengali truncate">{item.captionBn}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

