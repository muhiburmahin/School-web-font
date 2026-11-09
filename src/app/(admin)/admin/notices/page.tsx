import { NoticeManager } from "./notice-manager";

export const metadata = {
  title: "Notices Management | Admin",
  robots: { index: false, follow: false },
};

export default function AdminNoticesPage() {
  return <NoticeManager />;
}
