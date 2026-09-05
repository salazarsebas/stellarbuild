import styles from "./page.module.css";

const TEMPLATE_OWNER = "salazarsebas";
const TEMPLATE_REPO = "stellar-build-toolkit";

export default function HomePage() {
  const newRepoUrl = `https://github.com/new?template_owner=${TEMPLATE_OWNER}&template_name=${TEMPLATE_REPO}`;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.badge}>Claude Code skills for Stellar</span>
        <h1 className={styles.title}>stellar-build</h1>
        <p className={styles.subtitle}>
          Add a curated set of Stellar and Soroban development skills to a
          project in a couple of clicks. No CLI, no plugin install.
        </p>

        <div className={styles.grid}>
          <a href={newRepoUrl} className={styles.card}>
            <span className={styles.cardLabel}>New project</span>
            <h2 className={styles.cardTitle}>Start from a template</h2>
            <p className={styles.cardText}>
              Generate a repo pre-loaded with the toolkit using GitHub&apos;s
              native template flow.
            </p>
            <span className={styles.cardAction}>Use this template &#8594;</span>
          </a>

          <a href="/api/auth/login" className={styles.card}>
            <span className={styles.cardLabel}>Existing project</span>
            <h2 className={styles.cardTitle}>Add to your repo</h2>
            <p className={styles.cardText}>
              Sign in with GitHub to see every account and repo where the
              toolkit can be added.
            </p>
            <span className={styles.cardAction}>Sign in with GitHub &#8594;</span>
          </a>
        </div>

        <a
          className={styles.footerLink}
          href="https://github.com/salazarsebas/stellar-build-toolkit"
        >
          View the toolkit source on GitHub
        </a>
      </div>
    </main>
  );
}
