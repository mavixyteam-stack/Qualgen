import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "./db";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "qualgen-poc-dev-secret-change-in-production"
);
const COOKIE = "qg_session";

export type Session = { userId: string; orgId: string };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, orgId: string) {
  const token = await new SignJWT({ userId, orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string" || typeof payload.orgId !== "string")
      return null;
    return { userId: payload.userId, orgId: payload.orgId };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string;
  orgName: string;
  credits: number;
  demoSeeded: boolean;
  mode: "demo" | "live";
};

/** Cached per request — layout and page share one DB hit instead of two. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  await ensureSchema();
  const rows = await sql`
    select u.id, u.email, u.full_name, u.role, o.id as org_id, o.name as org_name,
           o.credits, o.demo_seeded, o.mode
    from users u join orgs o on o.id = u.org_id
    where u.id = ${session.userId}`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role ?? "member",
    orgId: r.org_id,
    orgName: r.org_name,
    credits: r.credits,
    demoSeeded: r.demo_seeded,
    mode: r.mode === "demo" ? "demo" : "live",
  };
});

/** For route handlers: returns the session or a thrown 401 Response. */
export async function requireApiSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw Response.json({ error: "Not signed in" }, { status: 401 });
  }
  await ensureSchema();
  return session;
}

/** For admin route handlers: session must belong to a platform admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireApiSession();
  const rows = await sql`select role from users where id = ${session.userId}`;
  if (rows[0]?.role !== "admin") {
    throw Response.json({ error: "Admins only." }, { status: 403 });
  }
  return session;
}
