import en from "../../../messages/en.json";
import type { LinkCategory } from "./types";

export const externalLinkMessages = {
  ...en.externalLinks,
  categories: en.externalLinks.categories satisfies Record<LinkCategory, string>,
};
