"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { TARGETS, type TargetKey } from "@/lib/targets";

interface Installation {
  id: number;
  login: string;
  type: "User" | "Organization";
  avatarUrl: string;
}

interface RepoRef {
  owner: string;
  name: string;
}

const APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
const DEFAULT_TARGETS = new Set<TargetKey>(["claude"]);

export default function DashboardPage() {
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready">("loading");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [reposByInstallation, setReposByInstallation] = useState<Record<number, RepoRef[]>>({});
  const [prUrls, setPrUrls] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, Set<TargetKey>>>({});

  useEffect(() => {
    fetch("/api/installations")
      .then(async (res) => {
        if (res.status === 401) {
          setStatus("signed-out");
          return null;
        }
        const data = await res.json();
        return data.installations as Installation[];
      })
      .then((installs) => {
        if (!installs) return;
        setInstallations(installs);
        setStatus("ready");
        installs.forEach((inst) => {
          fetch(`/api/repos?installation_id=${inst.id}`)
            .then((res) => res.json())
            .then((data) => {
              setReposByInstallation((prev) => ({ ...prev, [inst.id]: data.repos ?? [] }));
            });
        });
      });
  }, []);

  function toggleTarget(key: string, target: TargetKey) {
    setSelectedTargets((prev) => {
      const current = new Set(prev[key] ?? DEFAULT_TARGETS);
      if (current.has(target)) {
        current.delete(target);
      } else {
        current.add(target);
      }
      return { ...prev, [key]: current };
    });
  }

  async function handleAdd(installationId: number, repo: RepoRef) {
    const key = `${repo.owner}/${repo.name}`;
    const targets = Array.from(selectedTargets[key] ?? DEFAULT_TARGETS);
    setLoadingKey(key);
    setErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch("/api/add-toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installation_id: installationId,
          owner: repo.owner,
          repo: repo.name,
          targets,
        }),
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

  const installUrl = APP_SLUG ? `https://github.com/apps/${APP_SLUG}/installations/new` : null;

  if (status === "loading") {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.notice}>Loading&#8230;</p>
        </div>
      </main>
    );
  }

  if (status === "signed-out") {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <span className={styles.badge}>stellar-build</span>
          <h1 className={styles.title}>Sign in to continue</h1>
          <p className={styles.subtitle}>
            Sign in with GitHub to see the accounts and repos where the
            toolkit can be added.
          </p>
          <a className={styles.button} href="/api/auth/login">
            Sign in with GitHub
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.badge}>Signed in</span>
        <h1 className={styles.title}>Add the stellar-build toolkit</h1>
        <p className={styles.subtitle}>
          Pick a repo below and open a pull request that adds the toolkit to
          it.
        </p>

        {installations.length === 0 ? (
          <p className={styles.empty}>
            No installations yet.{" "}
            {installUrl ? <a href={installUrl}>Install the app on an account</a> : null}
          </p>
        ) : (
          installations.map((inst) => {
            const repos = reposByInstallation[inst.id];
            return (
              <section key={inst.id} className={styles.group}>
                <h2 className={styles.groupTitle}>
                  {inst.login}
                  <span className={styles.groupType}>{inst.type}</span>
                </h2>
                {!repos ? (
                  <p className={styles.empty}>Loading repositories&#8230;</p>
                ) : (
                  <ul className={styles.list}>
                    {repos.map((repo) => {
                      const key = `${repo.owner}/${repo.name}`;
                      const selected = selectedTargets[key] ?? DEFAULT_TARGETS;
                      return (
                        <li key={key} className={styles.row}>
                          <div className={styles.rowHeader}>
                            <span className={styles.repoName}>{key}</span>
                            <div className={styles.rowAction}>
                              {errors[key] ? <span className={styles.errorText}>{errors[key]}</span> : null}
                              {prUrls[key] ? (
                                <a href={prUrls[key]} className={styles.prLink} target="_blank" rel="noreferrer">
                                  View PR &#8594;
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.button}
                                  disabled={loadingKey === key || selected.size === 0}
                                  onClick={() => handleAdd(inst.id, repo)}
                                >
                                  {loadingKey === key
                                    ? "Adding..."
                                    : errors[key]
                                      ? "Retry"
                                      : "Add stellar-build tools"}
                                </button>
                              )}
                            </div>
                          </div>
                          {!prUrls[key] ? (
                            <div className={styles.targets}>
                              {TARGETS.map((t) => (
                                <label key={t.key} className={styles.targetLabel}>
                                  <input
                                    type="checkbox"
                                    checked={selected.has(t.key)}
                                    onChange={() => toggleTarget(key, t.key)}
                                  />
                                  {t.label}
                                </label>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })
        )}

        {installUrl ? (
          <a className={styles.footerLink} href={installUrl}>
            Install on another account
          </a>
        ) : null}
      </div>
    </main>
  );
}
