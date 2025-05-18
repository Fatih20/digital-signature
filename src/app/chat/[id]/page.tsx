"use client";

import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, AlertCircle, Loader2 } from "lucide-react";
import {
  hashMessage,
  signMessage,
  VerifiableMessage,
  verifyMessage,
} from "@/lib/cryptoUtils";

interface ChatMessage {
  id: number;
  createdAt: string;
  data: VerifiableMessage;
  senderId: number;
  receiverId: number;
}

interface TargetUser {
  id: number;
  name: string;
  publicKey: string;
}

interface FetchChatDataResponse {
  user: TargetUser;
  messages: ChatMessage[];
}

interface CurrentUser {
  id: number;
  username: string;
}

interface ApiErrorResponse {
  status: number;
  error: string;
}

interface FetchError extends Error {
  status?: number;
}

const fetchCurrentUser = async (): Promise<CurrentUser | ApiErrorResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/me`);
  if (!response.ok) {
    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }
    const errorText = await response.text();
    const fetchError = new Error(
      `Failed to fetch current user: ${response.status} ${errorText}`
    ) as FetchError;
    fetchError.status = response.status;
    throw fetchError;
  }
  return response.json();
};

const fetchChatData = async (
  chatId: string
): Promise<FetchChatDataResponse | ApiErrorResponse> => {
  if (!chatId) throw new Error("Chat ID is required");
  const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`);
  if (!response.ok) {
    if (response.status === 401) {
      return { status: 401, error: "Unauthorized" };
    }
    const errorText = await response.text();
    const fetchError = new Error(
      `Failed to fetch chat data: ${response.status} ${errorText}`
    ) as FetchError;
    fetchError.status = response.status;
    throw fetchError;
  }
  return response.json();
};

const postMessage = async ({
  chatId,
  messageData,
}: {
  chatId: string;
  messageData: VerifiableMessage;
}): Promise<ChatMessage> => {
  const response = await fetch(`${API_BASE_URL}/api/chat/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: messageData }),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to send message" }));
    const fetchError = new Error(
      errorData.error || `Failed to send message: ${response.status}`
    ) as FetchError;
    fetchError.status = response.status;
    throw fetchError;
  }
  return response.json();
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState("");

  const {
    data: currentUserResponse,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
    isError: isCurrentUserError,
    refetch: refetchCurrentUser,
  } = useQuery<CurrentUser | ApiErrorResponse, FetchError>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 1,
  });

  useEffect(() => {
    if (currentUserResponse && !Object.hasOwn(currentUserResponse, "error")) {
      const user = currentUserResponse as CurrentUser;
      const localPrivateKey = localStorage.getItem(
        `privateKey:${user.username}`
      );

      setPrivateKey(localPrivateKey);
    }
  }, [currentUserResponse]);

  const loggedInUser =
    currentUserResponse && !("status" in currentUserResponse)
      ? (currentUserResponse as CurrentUser)
      : null;

  const {
    data: chatDataResponse,
    isLoading: isLoadingChatData,
    error: chatDataError,
    isError: isChatDataError,
    refetch: refetchChatData,
  } = useQuery<FetchChatDataResponse | ApiErrorResponse, FetchError>({
    queryKey: ["chat", chatId],
    queryFn: () => fetchChatData(chatId!),
    enabled: !!chatId && !!loggedInUser,
    refetchInterval: 5000,
    retry: 1,
  });

  const targetUser =
    chatDataResponse && !("status" in chatDataResponse)
      ? (chatDataResponse as FetchChatDataResponse).user
      : null;

  const [messages, setMessages] = useState<
    (ChatMessage & { verified: boolean | null })[]
  >([]);

  useEffect(() => {
    const processMessages = async () => {
      if (chatDataResponse && !("status" in chatDataResponse)) {
        const messagesData = (chatDataResponse as FetchChatDataResponse)
          .messages;

        // Process messages with verification
        const verifiedMessages = await Promise.all(
          messagesData.map(async (msg) => {
            let verified = null;

            if (targetUser && msg.senderId === targetUser.id) {
              verified = await verifyMessage(msg.data, targetUser.publicKey);
            }

            return {
              ...msg,
              verified,
            };
          })
        );

        setMessages(verifiedMessages);
      } else {
        setMessages([]);
      }
    };

    processMessages();
  }, [chatDataResponse, targetUser]);

  const sendMessageMutation = useMutation<
    ChatMessage,
    FetchError,
    { chatId: string; messageData: VerifiableMessage }
  >({
    mutationFn: postMessage,
    onSuccess: (newMessageData) => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      setNewMessage("");
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      alert(`Error sending message: ${error.message}`);
    },
  });

  useEffect(() => {
    if (
      (currentUserResponse &&
        "status" in currentUserResponse &&
        currentUserResponse.status === 401) ||
      (chatDataResponse &&
        "status" in chatDataResponse &&
        chatDataResponse.status === 401)
    ) {
      router.push("/login");
    }
  }, [currentUserResponse, chatDataResponse, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !loggedInUser || !privateKey) return;

    const plaintext = newMessage.trim();
    const hash = hashMessage(plaintext);
    const sign = await signMessage(privateKey, hash);

    const verifiableMessage: VerifiableMessage = {
      plaintext: plaintext,
      hash: hash,
      signature: sign,
    };

    sendMessageMutation.mutate({ chatId, messageData: verifiableMessage });
  };

  const handleTryAgain = () => {
    if (isCurrentUserError) refetchCurrentUser();
    if (isChatDataError) refetchChatData();
  };

  const isLoading =
    isLoadingCurrentUser || (isLoadingChatData && !!loggedInUser);

  const getErrorMessage = (
    queryError: FetchError | ApiErrorResponse | null | undefined,
    defaultMessage: string
  ): string | null => {
    if (!queryError) return null;
    if (queryError instanceof Error) {
      return queryError.message;
    }
    if (
      typeof queryError === "object" &&
      "error" in queryError &&
      typeof queryError.error === "string"
    ) {
      return queryError.error;
    }
    return defaultMessage;
  };

  const primaryError =
    getErrorMessage(currentUserError, "Failed to load your profile.") ||
    (loggedInUser && getErrorMessage(chatDataError, "Failed to load chat."));

  if (!chatId) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
        <AlertCircle className="w-12 h-12 mb-4 text-yellow-400" />
        <h1 className="text-2xl font-semibold mb-2">Chat Not Found</h1>
        <p className="text-gray-400 mb-6">
          The chat ID is missing from the URL.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 text-white font-sans">
      <header className="w-full max-w-3xl flex justify-between items-center my-2 py-4 px-4 md:px-2 sticky top-0 z-10">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Back to contacts"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-100 truncate mx-4">
          {isLoading && !targetUser?.name
            ? "Loading Chat..."
            : targetUser?.name || "Chat"}
        </h1>
        <div className="w-10 h-10"> </div>
      </header>

      <main className="flex flex-col flex-grow w-full max-w-3xl bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-2xl rounded-t-xl overflow-hidden mt-1">
        {isLoading && !primaryError ? (
          <div className="flex-grow flex flex-col items-center justify-center p-10">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-xl text-gray-800">Loading messages...</p>
          </div>
        ) : !isLoading && !privateKey ? (
          <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-red-100">
              Error Loading Private Key
            </h2>
            <p className="text-md mb-6 text-red-200">Private key not found</p>
          </div>
        ) : primaryError ? (
          <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-red-100">
              Error Loading Chat
            </h2>
            <p className="text-md mb-6 text-red-200">{primaryError}</p>
            <button
              onClick={handleTryAgain}
              className="bg-yellow-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-800">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
              {messages.map((msg) => {
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === loggedInUser?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow ${
                        msg.senderId === loggedInUser?.id
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-700 text-gray-200 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words">
                        {msg.data.plaintext}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === loggedInUser?.id
                            ? "text-blue-200"
                            : "text-gray-400"
                        } text-right`}
                      >
                        {msg.verified === null
                          ? `${new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : `${new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} - ${
                              msg.verified ? "Verified" : "Not Verified"
                            }`}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t bg-slate-700 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow p-3 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-600 focus:border-transparent outline-none transition-colors"
                  disabled={
                    sendMessageMutation.isPending ||
                    !loggedInUser ||
                    !targetUser
                  }
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !newMessage.trim()}
                  className="p-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-800 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
                  aria-label="Send message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
