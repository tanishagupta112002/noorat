import { ExtendedUser } from "../_types/user";

export const fetchProfile = async () => {
  const res = await fetch("/api/profile/update", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("Profile fetch failed:", res.status, res.statusText);
    return null;
  }

  const data = await res.json();

  if (data?.success && data?.user) {
    return data.user as ExtendedUser;
  }

  return null;
};

export const updateProfile = async (form: ExtendedUser) => {
  const res = await fetch("/api/profile/update", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
    signal: AbortSignal.timeout(10000),
  });

  return res.json();
};