# Secure Chat Application with ECDSA & SHA-3

A Next.js implementation of a secure chat application using Elliptic Curve Digital Signature Algorithm (ECDSA) and SHA-3 hashing.

## How to Run the Application

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory with the following:
   ```env
   DATABASE_URL=your_database_connection_string
   API_BASE_URL=http://localhost:3000
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**:
   The application will be available at:
   ```
   http://localhost:3000
   ```

## Task Assignment

| Development Phase               | Assignee                     | NIM      |
|---------------------------------|------------------------------|----------|
| 1. User Registration           | Fatih Nararya Rashadyfa I.   | 13521060 |
| 2. Login System                | Fatih Nararya Rashadyfa I.   | 13521060 |
| 3. Contact List                | Fatih Nararya Rashadyfa I.   | 13521060 |
| 4. Message Signing & Sending   | Akbar Maulana Ridho          | 13521093 |
| 5. Message Verification        | Jazmy Izzati Alamsyah        | 18221124 |

## Features

- ECDSA for message signing and verification
- SHA-3 for message hashing
- Secure key management
- Real-time chat interface
- Message integrity verification

## Technology Stack

- Next.js (App Router)
- TypeScript
- PostgreSQL (with Drizzle ORM)
- ECDSA (with eccrypto library)
- SHA-3 (Keccak-256)
