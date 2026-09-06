"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./language-switcher.module.css";

const LOCALE_LABELS: Record<(typeof routing.locales)[number], string> = {
  en: "EN",
  es: "ES",
  pt: "PT",
};

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={styles.switcher} aria-label={t("label")}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          className={loc === locale ? styles.active : styles.link}
          disabled={loc === locale}
          onClick={() => router.replace(pathname, { locale: loc })}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
