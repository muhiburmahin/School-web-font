import { describe, expect, it } from "vitest";
import { configuredMenuLabel, publicMenuLabel, sameInstitutionName } from "@/lib/menu-label";
import { byLocale } from "@/i18n/text";

describe("menu labels", () => {
  it("keeps the full configured navigation label and its capitalization", () => {
    expect(configuredMenuLabel("Administration", "Administration and Teachers")).toBe("Administration and Teachers");
    expect(configuredMenuLabel("Academic", "Academic Information")).toBe("Academic Information");
    expect(configuredMenuLabel("About", "About College")).toBe("About College");
    expect(configuredMenuLabel("Home", "Holy Cross")).toBe("Holy Cross");
    expect(configuredMenuLabel("Results", "HSC Results")).toBe("HSC Results");
  });

  it("uses the saved page title when no navigation label is configured", () => {
    expect(configuredMenuLabel("Academic Information", null)).toBe("Academic Information");
    expect(configuredMenuLabel("About College", "  ")).toBe("About College");
  });

  it("selects the localized navigation label without rewriting it", () => {
    const label = { labelBn: "প্রশাসন ও শিক্ষক", labelEn: "Administration and Teachers" };
    expect(configuredMenuLabel("Administration", byLocale("en", label.labelBn, label.labelEn))).toBe("Administration and Teachers");
    expect(configuredMenuLabel("Administration", byLocale("bn", label.labelBn, label.labelEn))).toBe("প্রশাসন ও শিক্ষক");
  });

  it("uses a short label in the active language for starter menu titles", () => {
    expect(publicMenuLabel({
      slug: "administration",
      pageTitle: "Administration and Teachers",
      labelBn: "প্রশাসন ও শিক্ষক",
      labelEn: "Administration and Teachers",
      locale: "en",
    })).toBe("Administration");
    expect(publicMenuLabel({
      slug: "about",
      pageTitle: "About the Institution",
      labelBn: "প্রতিষ্ঠান পরিচিতি",
      labelEn: "About the Institution",
      locale: "bn",
    })).toBe("পরিচিতি");
    expect(publicMenuLabel({
      slug: "examinations",
      pageTitle: "Examination and Results",
      labelEn: "Examination and Results",
      labelBn: "পরীক্ষা ও ফলাফল",
      locale: "bn",
    })).toBe("ফলাফল");
  });

  it("keeps a custom menu label in the selected language", () => {
    expect(publicMenuLabel({
      slug: "about",
      pageTitle: "About the Institution",
      labelBn: "হলি ক্রস",
      labelEn: "Holy Cross",
      locale: "en",
    })).toBe("Holy Cross");
    expect(publicMenuLabel({
      slug: "about",
      pageTitle: "About the Institution",
      labelBn: "হলি ক্রস",
      labelEn: "Holy Cross",
      locale: "bn",
    })).toBe("হলি ক্রস");
    expect(publicMenuLabel({
      slug: "examinations",
      pageTitle: "Examination and Results",
      labelEn: "HSC Results",
      labelBn: "এইচএসসি ফলাফল",
      locale: "en",
    })).toBe("HSC Results");
  });

  it("hides a repeated institution name after normalizing whitespace", () => {
    expect(sameInstitutionName("Holy Cross", " holy   cross ")).toBe(true);
    expect(sameInstitutionName("Holy Cross", "হলি ক্রস")).toBe(false);
    expect(sameInstitutionName("  ", "Holy Cross")).toBe(false);
  });
});
