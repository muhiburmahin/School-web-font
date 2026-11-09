import { Alert, AlertTitle } from "@/components/ui/alert";
import { externalLinkMessages } from "../messages";

export function LinkChangesNotice() {
  return (
    <Alert>
      <AlertTitle>{externalLinkMessages.changesUnavailable}</AlertTitle>
    </Alert>
  );
}
