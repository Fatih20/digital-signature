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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 text-white">
      <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h1 className="text-5xl font-bold mb-8 text-white">Welcome!</h1>
        <p className="text-lg mb-10 text-gray-200">
          You have successfully logged in.
        </p>
        <form onSubmit={handleLogout}>
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-md hover:shadow-lg"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
