/**
 * useIPFSUpload.js
 * Signed Muse upload hook with loading and verification state.
 */

import { useState, useCallback } from "react";
import { uploadArtworkToIPFS } from "../services/ipfsService";

export function useIPFSUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(null);
  const [step, setStep] = useState("");

  const upload = useCallback(async (artworkFile, artworkInfo) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setVerified(null);

    try {
      setStep("Requesting wallet-signed upload challenge...");
      const uploadResult = await uploadArtworkToIPFS(artworkFile, artworkInfo);
      setStep("Verifying signed upload...");
      setVerified(Boolean(uploadResult.verified));
      setResult(uploadResult);
      setStep("Complete");
      return uploadResult;
    } catch (err) {
      const message = err?.response?.data?.error || err.message || "Upload failed.";
      setError(message);
      setStep("Error");
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, result, error, verified, step };
}
