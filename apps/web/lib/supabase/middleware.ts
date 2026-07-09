import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Prefix-matched public paths. The root landing page is matched exactly below
// (a "/" prefix would match every route and disable auth entirely).
const PUBLIC_PATHS = ["/auth"];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = path === "/" || PUBLIC_PATHS.some((p) => path.startsWith(p));

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Do not let a Vercel env-var misconfiguration take down the public landing
  // page or auth screen at the middleware layer. Protected routes still fail
  // closed to /auth; the auth form surfaces the Supabase connectivity problem
  // when the user submits credentials.
  const supabaseEnvIsValid = (() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }
    try {
      new URL(supabaseUrl);
      return true;
    } catch {
      return false;
    }
  })();

  if (!supabaseEnvIsValid) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("error", "supabase-env-invalid");
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl as string,
    supabaseAnonKey as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("error", "supabase-auth-unavailable");
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }
  if (user && path === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
