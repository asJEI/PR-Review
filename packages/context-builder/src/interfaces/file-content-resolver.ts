/**
 * Future hook for fetching full file content from GitHub blobs.
 * MVP does not wire this — surrounding context comes from patch hunks only.
 */
export interface FileContentResolver {
  resolve(path: string): Promise<string | null>;
}
