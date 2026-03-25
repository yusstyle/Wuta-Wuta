/**
 * ArtworkUploader.jsx
 * Uploads artwork through the signed Muse backend flow.
 */

import React, { useEffect, useRef, useState } from "react";
import { useIPFSUpload } from "../../hooks/useIPFSUpload";
import { useWalletStore } from "../../store/walletStore";

function generateArtworkId() {
  return `muse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ArtworkUploader({ onMintReady }) {
  const fileRef = useRef(null);
  const walletAddress = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    artistAddress: "",
    aiModel: "Stable Diffusion",
  });

  const { upload, uploading, result, error, verified, step } = useIPFSUpload();

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      artistAddress: walletAddress || "",
    }));
  }, [walletAddress]);

  function handleFileChange(event) {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  function handleFormChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isConnected || !walletAddress) {
      window.alert("Connect your Stellar wallet before uploading.");
      return;
    }

    if (!file) {
      window.alert("Please select an artwork file.");
      return;
    }

    const artworkInfo = {
      artworkId: generateArtworkId(),
      name: form.name,
      description: form.description,
      artistAddress: form.artistAddress,
      aiModel: form.aiModel,
    };

    try {
      const { tokenURI } = await upload(file, artworkInfo);
      if (onMintReady) onMintReady(tokenURI);
    } catch (_) {
      // Error is surfaced through hook state.
    }
  }

  return (
    <div className="artwork-uploader">
      <h2>Upload Artwork to IPFS</h2>
      <p className="subtitle">
        Muse now requires a Stellar wallet signature before the backend will pin
        artwork or metadata.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="drop-zone" onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="Artwork preview" className="preview-img" />
          ) : (
            <span>Click or drag artwork here (PNG / JPG / GIF / SVG)</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <label>
          Artwork Title *
          <input
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="e.g. Dreamscape #001"
            required
          />
        </label>

        <label>
          Description *
          <textarea
            name="description"
            value={form.description}
            onChange={handleFormChange}
            placeholder="Describe the artwork and the collaboration..."
            rows={3}
            required
          />
        </label>

        <label>
          Artist Stellar Address *
          <input
            name="artistAddress"
            value={form.artistAddress}
            onChange={handleFormChange}
            placeholder="G..."
            pattern="^G[A-Z2-7]{55}$"
            title="Enter a valid Stellar public key"
            required
          />
        </label>

        <label>
          AI Model Used
          <select name="aiModel" value={form.aiModel} onChange={handleFormChange}>
            <option>Stable Diffusion</option>
            <option>DALL-E 3</option>
            <option>Midjourney</option>
            <option>Adobe Firefly</option>
            <option>Other</option>
          </select>
        </label>

        <button type="submit" disabled={uploading || !isConnected}>
          {uploading ? step : "Sign & Upload to Muse"}
        </button>
      </form>

      {error && (
        <div className="status error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="status success">
          <h3>Upload authorized and pinned</h3>

          <table className="cid-table">
            <tbody>
              <tr>
                <th>Image CID</th>
                <td>
                  <code>{result.imageCID}</code>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${result.imageCID}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
              <tr>
                <th>Metadata CID</th>
                <td>
                  <code>{result.metadataCID}</code>{" "}
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${result.metadataCID}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
              <tr>
                <th>Token URI</th>
                <td>
                  <code>{result.tokenURI}</code>
                </td>
              </tr>
              <tr>
                <th>Signature Verified</th>
                <td>{verified ? "Confirmed" : "Could not verify"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .artwork-uploader { max-width: 640px; margin: 0 auto; font-family: sans-serif; }
        .subtitle { color: #666; margin-bottom: 1.5rem; }
        form { display: flex; flex-direction: column; gap: 1rem; }
        label { display: flex; flex-direction: column; gap: 0.25rem; font-weight: 600; font-size: 0.9rem; }
        input, textarea, select { padding: 0.6rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
        .drop-zone {
          border: 2px dashed #aaa; border-radius: 10px; padding: 2rem; text-align: center;
          cursor: pointer; color: #888; min-height: 160px; display: flex; align-items: center; justify-content: center;
        }
        .preview-img { max-height: 200px; border-radius: 8px; object-fit: contain; }
        button { padding: 0.75rem; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        button:disabled { background: #888; cursor: not-allowed; }
        .status { margin-top: 1.5rem; padding: 1rem; border-radius: 8px; }
        .error { background: #fff0f0; border: 1px solid #f88; color: #c00; }
        .success { background: #f0fff4; border: 1px solid #6dcd8b; }
        .cid-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.85rem; }
        .cid-table th { text-align: left; padding: 0.4rem 0.6rem; white-space: nowrap; color: #555; }
        .cid-table td { padding: 0.4rem 0.6rem; word-break: break-all; }
        .cid-table tr:nth-child(even) { background: #e8f5e9; }
        code { background: #eee; padding: 2px 4px; border-radius: 3px; font-size: 0.8rem; }
      `}</style>
    </div>
  );
}
