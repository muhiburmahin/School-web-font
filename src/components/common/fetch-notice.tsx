import { ErrorBox } from "./error-box";

export function FetchNotice({
  status,
  notFound,
  unavailable,
  invalid,
  forbidden,
}: {
  status: "not-found" | "unavailable" | "invalid-response" | "forbidden" | "unauthorized";
  notFound: string;
  unavailable: string;
  invalid: string;
  forbidden: string;
}) {
  const message =
    status === "not-found"
      ? notFound
      : status === "invalid-response"
        ? invalid
        : status === "forbidden" || status === "unauthorized"
          ? forbidden
          : unavailable;
  return <ErrorBox message={message} />;
}
