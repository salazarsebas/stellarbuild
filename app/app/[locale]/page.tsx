import { getTranslations } from "next-intl/server";
import styles from "./page.module.css";

const TEMPLATE_OWNER = "salazarsebas";
const TEMPLATE_REPO = "stellar-build-toolkit";

export default async function HomePage() {
  const t = await getTranslations("LandingPage");
  const newRepoUrl = `https://github.com/new?template_owner=${TEMPLATE_OWNER}&template_name=${TEMPLATE_REPO}`;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.badge}>{t("badge")}</span>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>

        <div className={styles.grid}>
          <a href={newRepoUrl} className={styles.card}>
            <span className={styles.cardLabel}>{t("newProjectLabel")}</span>
            <h2 className={styles.cardTitle}>{t("newProjectTitle")}</h2>
            <p className={styles.cardText}>{t("newProjectText")}</p>
            <span className={styles.cardAction}>{t("newProjectAction")}</span>
          </a>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this is an API route, not a page, and must not be prefetched */}
          <a href="/api/auth/login" className={styles.card}>
            <span className={styles.cardLabel}>{t("existingProjectLabel")}</span>
            <h2 className={styles.cardTitle}>{t("existingProjectTitle")}</h2>
            <p className={styles.cardText}>{t("existingProjectText")}</p>
            <span className={styles.cardAction}>{t("existingProjectAction")}</span>
          </a>
        </div>

        <a
          className={styles.footerLink}
          href="https://github.com/salazarsebas/stellar-build-toolkit"
        >
          {t("footerLink")}
        </a>
      </div>
    </main>
  );
}
