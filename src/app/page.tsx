"use client";

import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function Home() {
  const router = useRouter();

  async function handleLogout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent default form submission

    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        // Sending credentials might be necessary if the API expects/uses them for anything,
        // or if there are CORS issues with cookies not being sent otherwise.
        // For a simple logout, it might not be needed if the cookie is HttpOnly and managed by the browser.
        // credentials: 'include',
      });
      if (response.ok) {
        // Logout was successful on the server
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

    // Always redirect to login page after attempting logout
    // The middleware should handle access control based on actual cookie state.
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome!</h1>
        <form onSubmit={handleLogout}>
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
