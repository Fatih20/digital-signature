import { NextResponse } from "next/server";
import db from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { username, password: hashedPassword } = await request.json();

    if (!username || !hashedPassword) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 } // Conflict
      );
    }

    // Insert new user
    // The password is already hashed on the client-side
    await db.insert(usersTable).values({
      name: username,
      password: hashedPassword,
    });

    return NextResponse.json(
      { success: true, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error during signup" },
      { status: 500 }
    );
  }
}
