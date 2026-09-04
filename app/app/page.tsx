import styles from "./page.module.css";

const TEMPLATE_OWNER = "salazarsebas";
const TEMPLATE_REPO = "stellar-build-toolkit";
const APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";

export default function HomePage() {
  const newRepoUrl = `https://github.com/new?template_owner=${TEMPLATE_OWNER}&template_name=${TEMPLATE_REPO}`;
  const installUrl = APP_SLUG
    ? `https://github.com/apps/${APP_SLUG}/installations/new`
    : null;

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

          {installUrl ? (
            <a href={installUrl} className={styles.card}>
              <span className={styles.cardLabel}>Existing project</span>
              <h2 className={styles.cardTitle}>Add to your repo</h2>
              <p className={styles.cardText}>
                Install the GitHub App and open a pull request that adds the
                toolkit to a repo you already have.
              </p>
              <span className={styles.cardAction}>Install the app &#8594;</span>
            </a>
          ) : (
            <div className={`${styles.card} ${styles.cardDisabled}`}>
              <span className={styles.cardLabel}>Existing project</span>
              <h2 className={styles.cardTitle}>Add to your repo</h2>
              <p className={styles.cardText}>Coming soon.</p>
            </div>
          )}
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
