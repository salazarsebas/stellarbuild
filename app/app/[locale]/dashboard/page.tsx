"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

type ReposState = RepoRef[] | "error";

const APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
const DEFAULT_TARGETS = new Set<TargetKey>(["claude"]);

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready" | "error">("loading");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [reposByInstallation, setReposByInstallation] = useState<Record<number, ReposState>>({});
  const [prUrls, setPrUrls] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, Set<TargetKey>>>({});
  const [authError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("authError");
  });

  useEffect(() => {
    fetch("/api/installations")
      .then(async (res) => {
        if (res.status === 401) {
          setStatus("signed-out");
          return null;
        }
        if (!res.ok) {
          throw new Error("Failed to load installations");
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
            .then(async (res) => {
              if (!res.ok) throw new Error("Failed to load repos");
              const data = await res.json();
              return data.repos as RepoRef[];
            })
            .then((repos) => {
              setReposByInstallation((prev) => ({ ...prev, [inst.id]: repos }));
            })
            .catch(() => {
              setReposByInstallation((prev) => ({ ...prev, [inst.id]: "error" }));
            });
        });
      })
      .catch(() => {
        setStatus("error");
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
          <p className={styles.notice}>{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <span className={styles.badge}>stellar-build</span>
          <h1 className={styles.title}>{t("errorTitle")}</h1>
          <p className={styles.subtitle}>{t("errorSubtitle")}</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- forces a full reload so the fetch effect reruns from a clean mount */}
          <a className={styles.button} href="/dashboard">
            {t("errorRetry")}
          </a>
        </div>
      </main>
    );
  }

  if (status === "signed-out") {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <span className={styles.badge}>{t("signedOutBadge")}</span>
          <h1 className={styles.title}>{t("signedOutTitle")}</h1>
          <p className={styles.subtitle}>{t("signedOutSubtitle")}</p>
          {authError ? (
            <p className={styles.errorText}>
              {authError === "invalid_state"
                ? t("authErrorInvalidState")
                : authError === "missing_config"
                  ? t("authErrorMissingConfig")
                  : authError === "token_exchange_failed"
                    ? t("authErrorTokenExchangeFailed")
                    : t("authErrorDefault")}
            </p>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this is an API route, not a page, and must not be prefetched */}
          <a className={styles.button} href="/api/auth/login">
            {t("signInButton")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.badge}>{t("signedInBadge")}</span>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>

        {installations.length === 0 ? (
          <p className={styles.empty}>
            {t("noInstallations")}{" "}
            {installUrl ? (
              <a href={installUrl} target="_blank" rel="noreferrer">
                {t("installLink")}
              </a>
            ) : null}
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
                  <p className={styles.empty}>{t("loadingRepos")}</p>
                ) : repos === "error" ? (
                  <p className={styles.errorText}>{t("reposError")}</p>
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
                                  {t("viewPr")}
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.button}
                                  disabled={loadingKey === key || selected.size === 0}
                                  onClick={() => handleAdd(inst.id, repo)}
                                >
                                  {loadingKey === key
                                    ? t("addingButton")
                                    : errors[key]
                                      ? t("retryButton")
                                      : t("addButton")}
                                </button>
                              )}
                            </div>
                          </div>
                          {!prUrls[key] ? (
                            <div className={styles.targets}>
                              {TARGETS.map((tk) => (
                                <label key={tk.key} className={styles.targetLabel}>
                                  <input
                                    type="checkbox"
                                    checked={selected.has(tk.key)}
                                    onChange={() => toggleTarget(key, tk.key)}
                                  />
                                  {tk.label}
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
          <a className={styles.footerLink} href={installUrl} target="_blank" rel="noreferrer">
            {t("installOnAnother")}
          </a>
        ) : null}
      </div>
    </main>
  );
}
