"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

interface RepoRef {
  owner: string;
  name: string;
}

function InstalledPageContent() {
  const searchParams = useSearchParams();
  const installationId = searchParams.get("installation_id");
  const [repos, setRepos] = useState<RepoRef[]>([]);
  const [prUrls, setPrUrls] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!installationId) return;
    fetch(`/api/repos?installation_id=${installationId}`)
      .then((res) => res.json())
      .then((data) => setRepos(data.repos ?? []));
  }, [installationId]);

  async function handleAdd(repo: RepoRef) {
    const key = `${repo.owner}/${repo.name}`;
    setLoadingKey(key);
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch("/api/add-toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installation_id: installationId, owner: repo.owner, repo: repo.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }
      setPrUrls((prev) => ({ ...prev, [key]: data.prUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrors((prev) => ({ ...prev, [key]: message }));
    } finally {
      setLoadingKey(null);
    }
  }

  if (!installationId) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <span className={styles.badge}>stellar-build</span>
          <h1 className={styles.title}>Missing installation</h1>
          <p className={styles.notice}>
            Missing installation_id. Install the app from the landing page
            first.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.badge}>App installed</span>
        <h1 className={styles.title}>Add the stellar-build toolkit</h1>
        <p className={styles.subtitle}>
          Pick a repo below and open a pull request that adds the toolkit to
          it.
        </p>

        {repos.length === 0 ? (
          <p className={styles.empty}>Loading repositories&hellip;</p>
        ) : (
          <ul className={styles.list}>
            {repos.map((repo) => {
              const key = `${repo.owner}/${repo.name}`;
              return (
                <li key={key} className={styles.row}>
                  <span className={styles.repoName}>{key}</span>
                  <div className={styles.rowAction}>
                    {errors[key] ? (
                      <span className={styles.errorText}>{errors[key]}</span>
                    ) : null}
                    {prUrls[key] ? (
                      <a
                        href={prUrls[key]}
                        className={styles.prLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View PR &#8594;
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={styles.button}
                        disabled={loadingKey === key}
                        onClick={() => handleAdd(repo)}
                      >
                        {loadingKey === key
                          ? "Adding..."
                          : errors[key]
                            ? "Retry"
                            : "Add stellar-build tools"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

export default function InstalledPage() {
  return (
    <Suspense fallback={null}>
      <InstalledPageContent />
    </Suspense>
  );
}
