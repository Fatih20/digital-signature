import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const usernameCookie = cookieStore.get("username");

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    // If the main session is not valid, don't return user info
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (usernameCookie) {
    return NextResponse.json({ username: usernameCookie.value });
  } else {
    // This case should ideally not happen if login sets it correctly
    return NextResponse.json({ error: "Username not found" }, { status: 404 });
  }
}
