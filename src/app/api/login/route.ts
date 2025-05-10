import { NextResponse } from "next/server";
import db from "@/db"; // default import for Drizzle instance
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
// Note: 'cookies' from 'next/headers' is not directly used for setting in this revised version.
// We use response.cookies.set() instead.

export async function POST(request: Request) {
  try {
    const { username, password: hashedPasswordFromClient } =
      await request.json();

    if (!username || !hashedPasswordFromClient) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user in database by username (which corresponds to the 'name' field in schema)
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, username))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Compare the hashed password from the client with the stored hashed password
    // Since passwords are now hashed client-side, we do a direct comparison.
    if (user.password !== hashedPasswordFromClient) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // If credentials are valid, set session cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });
    response.cookies.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    // Set username cookie
    response.cookies.set("username", user.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login" },
      { status: 500 }
    );
  }
}
