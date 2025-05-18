import * as eccrypto from "eccrypto";
import { keccak256 } from "js-sha3";
import { Buffer } from "buffer";

// Polyfill Buffer for browser if needed
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

export interface MessageSignature {
  r: string;
  s: string;
}

export interface VerifiableMessage {
  plaintext: string;
  hash: string;
  signature: MessageSignature;
}

/**
 * Verifies a message using ECDSA and SHA-3
 * @param message Message object containing plaintext, hash, and signature
 * @param publicKey Public key of the sender in hex format
 * @returns Promise resolving to boolean indicating if verification was successful
 */
export const verifyMessage = async (
  message: VerifiableMessage,
  publicKey: string
): Promise<boolean> => {
  try {
    // Verify SHA3 hash - recompute hash from plaintext and compare
    const computedHash = keccak256(message.plaintext);
    if (computedHash !== message.hash) {
      console.warn("Hash mismatch - message may have been tampered with");
      return false;
    }

    // Prepare inputs for eccrypto
    const publicKeyBuffer = Buffer.from(publicKey, "hex");
    const messageHashBuffer = Buffer.from(message.hash, "hex");

    // Create DER formatted signature from r and s components
    const r = Buffer.from(message.signature.r, "hex");
    const s = Buffer.from(message.signature.s, "hex");

    // eccrypto expects a DER formatted signature
    const signatureBuffer = Buffer.concat([
      Buffer.from([0x30, r.length + s.length + 4, 0x02, r.length]),
      r,
      Buffer.from([0x02, s.length]),
      s,
    ]);

    // Verify signature using eccrypto
    await eccrypto.verify(publicKeyBuffer, messageHashBuffer, signatureBuffer);
    return true;
  } catch (error) {
    console.error(
      "Signature verification failed:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};
/**
 * Hashes a message using SHA-3 (keccak256)
 * @param message Plaintext message to hash
 * @returns Hex string of the hash
 */
export const hashMessage = (message: string): string => {
  return keccak256(message);
};

/**
 * Signs a message hash using ECDSA
 * @param privateKey Private key in hex format
 * @param messageHash Hash of the message in hex format
 * @returns Object containing r and s components of the signature
 */
export const signMessage = async (
  privateKey: string,
  messageHash: string
): Promise<MessageSignature> => {
  try {
    const privateKeyBuffer = Buffer.from(privateKey, "hex");
    const messageHashBuffer = Buffer.from(messageHash, "hex");

    // Sign the message hash with the private key
    const signature = await eccrypto.sign(privateKeyBuffer, messageHashBuffer);

    // The signature returned by eccrypto is in DER format, we need to extract r and s
    // DER format is: 0x30 [totalLength] 0x02 [rLength] [r] 0x02 [sLength] [s]
    let offset = 4; // Skip 0x30, totalLength, 0x02, rLength
    const rLength = signature[3];
    const r = signature.slice(offset, offset + rLength);
    offset += rLength + 2; // Skip r, 0x02, sLength
    const s = signature.slice(offset);

    return {
      r: r.toString("hex"),
      s: s.toString("hex"),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Signing failed:", errorMessage);
    throw new Error("Failed to sign message: " + errorMessage);
  }
};

/**
 * Generates a new ECDSA key pair
 * @returns Object containing private and public keys in hex format
 */
export const generateKeyPair = (): {
  privateKey: string;
  publicKey: string;
} => {
  try {
    // Generate a new random private key
    const privateKey = eccrypto.generatePrivate();
    // Corresponding public key
    const publicKey = eccrypto.getPublic(privateKey);

    return {
      privateKey: privateKey.toString("hex"),
      publicKey: publicKey.toString("hex"),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Key generation failed:", errorMessage);
    throw new Error("Failed to generate key pair: " + errorMessage);
  }
};

/**
 * Formats a message with its hash and signature for transmission
 * @param plaintext Original message text
 * @param privateKey Sender's private key
 * @returns Complete verifiable message object
 */
export const createSignedMessage = async (
  plaintext: string,
  privateKey: string
): Promise<VerifiableMessage> => {
  try {
    // Hash the message
    const hash = hashMessage(plaintext);

    // Sign the hash
    const signature = await signMessage(privateKey, hash);

    //Return the complete message object
    return {
      plaintext,
      hash,
      signature,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to create signed message:", errorMessage);
    throw new Error("Failed to create signed message: " + errorMessage);
  }
};
