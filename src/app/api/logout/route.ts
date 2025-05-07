import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Logged out successfully" },
    {
      status: 200,
      headers: {
        // Clear the token cookie by setting it to expire immediately
        "Set-Cookie": `token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      },
    }
  );
}
