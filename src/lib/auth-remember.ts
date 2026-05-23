/** Client-side preference only — never stores the password. */
export const REMEMBER_ME_KEY = "three-hats-remember-me";
export const REMEMBER_EMAIL_KEY = "three-hats-remember-email";

/** Persistent login cookie lifetime when Remember me is checked (30 days). */
export const REMEMBER_ME_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function loadRememberMePreference(): { rememberMe: boolean; email: string } {
  if (typeof window === "undefined") {
    return { rememberMe: true, email: "" };
  }

  const stored = localStorage.getItem(REMEMBER_ME_KEY);
  return {
    rememberMe: stored !== "0",
    email: localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "",
  };
}

export function persistRememberMePreference(rememberMe: boolean, email: string) {
  localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "1" : "0");
  if (rememberMe) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
  }
}
