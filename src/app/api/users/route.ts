import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db"; // Import the Drizzle instance
import { usersTable } from "@/db/schema"; // Import the users table
import { eq, not } from "drizzle-orm"; // Import Drizzle operators

// Function to get all users from the database, excluding the current user
async function getOtherUsersFromDB(
  currentUserId: number
): Promise<{ id: number; username: string }[]> {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.name, // Use 'name' field as 'username'
        publicKey: usersTable.publicKey,
      })
      .from(usersTable)
      .where(not(eq(usersTable.id, currentUserId))); // Exclude the current user
    return users;
  } catch (error) {
    console.error("Database error fetching users:", error);
    throw new Error("Could not fetch users from database.");
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const currentUsername = cookieStore.get("username")?.value;

    if (!currentUsername) {
      return NextResponse.json(
        { message: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const currentUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.name, currentUsername));

    if (currentUser.length === 0) {
      return NextResponse.json(
        { message: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    const otherUsers = await getOtherUsersFromDB(currentUser[0].id);

    return NextResponse.json(otherUsers);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    // Check if it's a known error type or just a generic message
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
