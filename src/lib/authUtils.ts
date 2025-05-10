export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  // Ensure crypto.subtle is available (runs in browser/client-side context)
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  } else {
    // Fallback or error for environments where SubtleCrypto is not available (e.g. SSR without polyfill)
    // This function is intended for client-side use where window.crypto is available.
    console.error("SubtleCrypto not available. Ensure this runs client-side.");
    throw new Error("SubtleCrypto not available for password hashing.");
  }
}
