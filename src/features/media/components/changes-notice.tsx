import { EmptyState } from "@/components/common/empty-state";
import { mediaMessages } from "../messages";

export function MediaChangesNotice() {
  return <EmptyState title={mediaMessages.changesUnavailable} />;
}
