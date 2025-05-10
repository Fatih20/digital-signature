"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";
import { hashPassword } from "@/lib/authUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Define the type for the login payload
interface LoginPayload {
  username: string;
  passwordHash: string;
}

// Define the type for the API response (can be more specific if known)
interface LoginResponse {
  // Assuming a successful login doesn't return much, or you might have a user object
  message?: string;
  error?: string; // For error responses
}

// Asynchronous function to perform the login API call
const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username,
      password: payload.passwordHash,
    }),
  });

  const data: LoginResponse = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed. Please try again.");
  }
  return data;
};

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      router.push("/");
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!username || !password) {
      setFormError("Username and password are required.");
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      loginMutation.mutate({ username, passwordHash: hashedPassword });
    } catch (err) {
      console.error("Password hashing error:", err);
      setFormError(
        "An unexpected error occurred during login preparation. Please try again."
      );
    }
  }

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
          <div className="text-center mb-8">
            {/* You can replace this with an SVG logo or an Image component */}
            <h1 className="text-4xl font-bold text-gray-800">AppLogin</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">
            Login to Your Account
          </h2>
          <form onSubmit={handleSubmit}>
            {(formError || loginMutation.error) && (
              <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md text-sm text-center border border-red-300">
                {formError || (loginMutation.error as Error)?.message}
              </p>
            )}
            <div className="mb-5">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
                placeholder="Enter your username"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-purple-600 hover:text-purple-500 transition duration-150 ease-in-out"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
