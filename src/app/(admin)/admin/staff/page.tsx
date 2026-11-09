import { StaffManager } from "./staff-manager";

export const metadata = {
  title: "Staff & Governing Body | Admin",
  robots: { index: false, follow: false },
};

export default function AdminStaffPage() {
  return <StaffManager />;
}
