import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/db";
import { usersTable, messagesTable } from "@/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import { VerifiableMessage } from "@/lib/cryptoUtils";

interface PostRequestBody {
  data: VerifiableMessage; // need types?
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const usernameCookie = cookieStore.get("username");
  const idCookie = cookieStore.get("id");
  const routeParam = await params;

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!idCookie || !idCookie.value) {
    return NextResponse.json(
      { error: "User ID not found in session" },
      { status: 401 }
    );
  }

  if (!usernameCookie || !usernameCookie.value) {
    return NextResponse.json(
      { error: "Username not found in session" },
      { status: 401 }
    );
  }

  const loggedInUserId = parseInt(idCookie.value, 10);
  if (isNaN(loggedInUserId)) {
    return NextResponse.json(
      { error: "Invalid user ID format in session" },
      { status: 400 }
    );
  }

  const targetUserId = parseInt(routeParam.id, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json(
      { error: "Invalid target user ID format in route" },
      { status: 400 }
    );
  }

  const targetUsers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      publicKey: usersTable.publicKey,
    })
    .from(usersTable)
    .where(eq(usersTable.id, targetUserId))
    .limit(1);

  if (targetUsers.length === 0) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 }
    );
  }
  const targetUser = targetUsers[0];

  // Fetch messages between the logged-in user and the target user
  // Messages are sorted by creation date, newest first
  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(
          eq(messagesTable.senderId, loggedInUserId),
          eq(messagesTable.receiverId, targetUserId)
        ),
        and(
          eq(messagesTable.senderId, targetUserId),
          eq(messagesTable.receiverId, loggedInUserId)
        )
      )
    )
    .orderBy(asc(messagesTable.createdAt));

  return NextResponse.json({
    user: targetUser,
    messages: messages,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const idCookie = cookieStore.get("id");
  const routeParam = await params;

  if (!sessionCookie || sessionCookie.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!idCookie || !idCookie.value) {
    return NextResponse.json(
      { error: "User ID not found in session" },
      { status: 401 }
    );
  }

  const senderId = parseInt(idCookie.value, 10);
  if (isNaN(senderId)) {
    return NextResponse.json(
      { error: "Invalid user ID format in session" },
      { status: 400 }
    );
  }

  const receiverId = parseInt(routeParam.id, 10);
  if (isNaN(receiverId)) {
    return NextResponse.json(
      { error: "Invalid receiver ID format in route" },
      { status: 400 }
    );
  }

  if (senderId === receiverId) {
    return NextResponse.json(
      { error: "Cannot send messages to yourself" },
      { status: 400 }
    );
  }

  const receivingUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, receiverId))
    .limit(1);

  if (receivingUsers.length === 0) {
    return NextResponse.json(
      { error: "Receiver user not found" },
      { status: 404 }
    );
  }

  let requestBody: PostRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data } = requestBody;

  if (!data) {
    return NextResponse.json(
      { error: "Message data is required" },
      { status: 400 }
    );
  }

  // uncomment this for altering message
  // data.plaintext = `${data.plaintext} - Altered`;

  try {
    const newMessages = await db
      .insert(messagesTable)
      .values({
        senderId: senderId,
        receiverId: receiverId,
        data: data,
      })
      .returning();

    if (newMessages.length === 0) {
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    return NextResponse.json(newMessages[0], { status: 201 });
  } catch (error) {
    console.error("Failed to insert message:", error);
    return NextResponse.json(
      { error: "Could not save message to the database" },
      { status: 500 }
    );
  }
}
