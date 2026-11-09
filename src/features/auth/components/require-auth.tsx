import { redirect } from "next/navigation";
import { ErrorBox } from "@/components/common/error-box";
import { authMessages } from "../messages";
import type { SessionResult } from "../types";

export function RequireAuth({
  session,
  children,
  messages = authMessages,
}: {
  session: SessionResult;
  children: React.ReactNode;
  messages?: typeof authMessages;
}) {
  if (session.status === "anonymous") redirect("/login");
  if (session.status === "forbidden") {
    return <ErrorBox message={messages.forbidden} />;
  }
  if (session.status === "unavailable") {
    return <ErrorBox message={messages.unavailable} />;
  }
  return children;
}
