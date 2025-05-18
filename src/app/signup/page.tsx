"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import eccrypto from "eccrypto";
import { API_BASE_URL } from "@/lib/config";
import { hashPassword } from "@/lib/authUtils";
import { useMutation } from "@tanstack/react-query";
import { generateKeyPair } from "@/lib/cryptoUtils";

// Define types for payload and response
interface SignupPayload {
  username: string;
  passwordHash: string;
  publicKey: string;
}

interface SignupResponse {
  message?: string;
  error?: string;
}

// Asynchronous function to perform the signup API call
const signupUser = async (payload: SignupPayload): Promise<SignupResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: payload.username,
      password: payload.passwordHash,
      publicKey: payload.publicKey,
    }),
  });

  const data: SignupResponse = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Signup failed. Please try again.");
  }
  return data;
};

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Local form error state, API errors handled by mutation
  const [formError, setFormError] = useState<string | null>(null);

  const signupMutation = useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: signupUser,
    onSuccess: () => {
      router.push("/login"); // Redirect to login page after successful signup
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!username || !password) {
      setFormError("Username and password are required.");
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);

      const { privateKey, publicKey } = generateKeyPair();

      // Important: Save private key to local storage BEFORE calling mutate,
      // so it's saved even if the user navigates away during the mutation.
      // However, consider the implications if the API call fails - private key is saved but account might not be created.
      // A more robust approach might save it in onSuccess, but that means if redirect is quick, user might miss it.
      // For now, keeping it here for simplicity of this example.
      localStorage.setItem(`privateKey:${username}`, privateKey);

      signupMutation.mutate({
        username,
        passwordHash: hashedPassword,
        publicKey: publicKey,
      });
    } catch (err) {
      console.error("Signup preparation error (e.g., hashing, keygen):", err);
      // If error is an instance of Error, use its message
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during signup preparation. Please try again.";
      setFormError(errorMessage);
    }
  }

  const isLoading = signupMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">AppSignup</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">
            Create Your Account
          </h2>
          <form onSubmit={handleSubmit}>
            {(formError || signupMutation.error) && (
              <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md text-sm text-center border border-red-300">
                {formError || (signupMutation.error as Error)?.message}
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
                placeholder="Choose a username"
              />
            </div>
            <div className="mb-5">
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
                placeholder="Create a password"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
                placeholder="Confirm your password"
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
                  Signing up...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:text-purple-500 transition duration-150 ease-in-out"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
