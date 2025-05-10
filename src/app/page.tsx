"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { useEffect, useState, useCallback } from "react";

interface User {
  id: number;
  username: string;
  publicKey: string;
}

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Centralized data loading function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let redirectToLogin = false;

    try {
      // Fetch current user's username
      const meResponse = await fetch(`${API_BASE_URL}/api/me`);
      if (meResponse.ok) {
        const data = await meResponse.json();
        if (data.username) {
          setUsername(data.username);
        }
      } else if (meResponse.status === 401) {
        redirectToLogin = true;
      } else {
        console.error(
          "Failed to fetch username:",
          meResponse.status,
          await meResponse.text()
        );
        setError(
          (prevError) =>
            prevError || "Failed to load your profile. Please try again."
        );
      }

      if (redirectToLogin) {
        router.push("/login");
        setIsLoading(false); // Stop loading before redirect
        return;
      }

      // Fetch other users
      const usersResponse = await fetch(`${API_BASE_URL}/api/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else if (usersResponse.status === 401) {
        redirectToLogin = true; // Mark for redirect
      } else {
        console.error(
          "Failed to fetch users:",
          usersResponse.status,
          await usersResponse.text()
        );
        setError(
          (prevError) =>
            prevError || "Failed to load users list. Please try again."
        );
      }

      if (redirectToLogin) {
        router.push("/login");
        setIsLoading(false); // Stop loading before redirect
        return;
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError("An unexpected error occurred. Please try refreshing.");
    }
    setIsLoading(false);
  }, [router, setUsername, setUsers, setIsLoading, setError]);

  useEffect(() => {
    console.log(users);
  }, [users]);

  useEffect(() => {
    loadData();
  }, [loadData, error]);

  async function handleLogout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
      });
      if (response.ok) {
        console.log("Logout successful");
      } else {
        console.error(
          "Logout API call failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching logout API:", error);
    }
    router.push("/login");
  }

  // Handler for the "Try Again" button
  const handleTryAgainClick = () => {
    loadData(); // Simply call the centralized loading function
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <header className="w-full max-w-3xl flex justify-between items-center py-4 px-2 md:px-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 truncate pr-2">
          {isLoading && !username
            ? "Loading..."
            : username
            ? `Welcome, ${username}!`
            : "Welcome!"}
        </h1>
        <form onSubmit={handleLogout} className="flex-shrink-0">
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 sm:py-2 sm:px-5 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-3xl w-full">
        {isLoading ? (
          <div className="py-10">
            <p className="text-white text-xl">Loading user data...</p>
          </div>
        ) : error ? (
          <div className="py-10">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Error</h2>
            <p className="text-lg mb-6 text-gray-200">{error}</p>
            <button
              onClick={handleTryAgainClick}
              className="w-full max-w-xs mx-auto bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-semibold mb-6 text-gray-700">
              Contact List
            </h2>
            {users.length > 0 ? (
              <ul className="space-y-4 text-left">
                {users.map((user) => (
                  <li
                    key={user.id}
                    className="bg-white bg-opacity-25 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <p className="text-xl font-semibold text-gray-800">
                      {user.username}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-lg text-gray-200">No other users found.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
