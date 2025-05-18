import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const usernameCookie = cookieStore.get("username");
  const idCookie = cookieStore.get("id");

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    // If the main session is not valid, don't return user info
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!usernameCookie) {
    // This case should ideally not happen if login sets it correctly
    return NextResponse.json({ error: "Username not found" }, { status: 404 });
  }

  if (!idCookie) {
    // This case should ideally not happen if login sets it correctly
    return NextResponse.json({ error: "Id not found" }, { status: 404 });
  }

  const loggedInUserId = parseInt(idCookie.value, 10);
  if (isNaN(loggedInUserId)) {
    return NextResponse.json(
      { error: "Invalid user ID format in session" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    username: usernameCookie.value,
    id: loggedInUserId,
  });
}
