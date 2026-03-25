/**
 * ipfsService.js
 * Issue #6 - Secure Metadata Storage via IPFS/Pinata
 *
 * Handles signed Muse uploads so only the connected Stellar wallet holder
 * can authorize artwork pinning through the backend.
 */

import axios from "axios";
import { useWalletStore } from "../store/walletStore";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";
const MUSE_UPLOAD_API_URL = process.env.REACT_APP_MUSE_UPLOAD_API_URL || "/api/muse/upload";
const MUSE_UPLOAD_CHALLENGE_URL = `${MUSE_UPLOAD_API_URL}/challenge`;

const pinataHeaders = () => {
  const jwt = process.env.REACT_APP_PINATA_JWT;
  if (!jwt) throw new Error("REACT_APP_PINATA_JWT is not set in environment variables.");
  return {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
};

export async function pinFileToIPFS(file, artworkId) {
  const formData = new FormData();
  formData.append("file", file);

  formData.append("pinataMetadata", JSON.stringify({
    name: `muse-artwork-${artworkId}`,
    keyvalues: {
      project: "Wuta-Wuta",
      type: "artwork",
      artworkId,
    },
  }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const jwt = process.env.REACT_APP_PINATA_JWT;
  if (!jwt) throw new Error("REACT_APP_PINATA_JWT is not set in environment variables.");

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
    maxBodyLength: Infinity,
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  return response.data.IpfsHash;
}

export async function pinMetadataToIPFS(metadata, artworkId) {
  const body = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `muse-metadata-${artworkId}`,
      keyvalues: {
        project: "Wuta-Wuta",
        type: "metadata",
        artworkId,
      },
    },
    pinataOptions: { cidVersion: 1 },
  };

  const response = await axios.post(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, body, {
    headers: pinataHeaders(),
  });

  return response.data.IpfsHash;
}

export function buildNFTMetadata({
  name,
  description,
  imageCID,
  artistAddress,
  aiModel,
  collaborators = [],
  attributes = [],
}) {
  return {
    name,
    description,
    image: `ipfs://${imageCID}`,
    external_url: `${PINATA_GATEWAY}/${imageCID}`,
    artist: artistAddress,
    ai_model: aiModel,
    collaborators,
    created_at: new Date().toISOString(),
    attributes: [
      { trait_type: "AI Model", value: aiModel },
      { trait_type: "Artist", value: artistAddress },
      { trait_type: "Collaboration Type", value: "AI-Human" },
      ...attributes,
    ],
  };
}

export async function uploadArtworkToIPFS(artworkFile, artworkInfo) {
  const { address, isConnected, signMessage } = useWalletStore.getState();

  if (!isConnected || !address) {
    throw new Error("Connect a Stellar wallet before uploading.");
  }

  if (artworkInfo.artistAddress && artworkInfo.artistAddress !== address) {
    throw new Error("Upload signer does not match the selected Stellar wallet.");
  }

  const fileBuffer = await artworkFile.arrayBuffer();
  const fileSha256 = await sha256Hex(fileBuffer);
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomUUID();

  const challengeResponse = await axios.post(MUSE_UPLOAD_CHALLENGE_URL, {
    publicKey: address,
    artworkId: artworkInfo.artworkId,
    name: artworkInfo.name,
    description: artworkInfo.description,
    aiModel: artworkInfo.aiModel,
    mimeType: artworkFile.type || "application/octet-stream",
    fileSha256,
    fileSize: artworkFile.size,
    timestamp,
    nonce,
  });

  const signature = await signMessage(challengeResponse.data.challenge);
  const formData = new FormData();
  formData.append("artwork", artworkFile);
  formData.append("publicKey", address);
  formData.append("artworkId", artworkInfo.artworkId);
  formData.append("name", artworkInfo.name);
  formData.append("description", artworkInfo.description);
  formData.append("aiModel", artworkInfo.aiModel);
  formData.append("timestamp", timestamp);
  formData.append("nonce", nonce);
  formData.append("signature", normalizeSignature(signature));

  const response = await axios.post(MUSE_UPLOAD_API_URL, formData);
  return response.data.data;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeSignature(signature) {
  if (typeof signature === "string") {
    return signature;
  }

  if (signature?.signature) {
    return signature.signature;
  }

  if (signature?.signedMessage) {
    return signature.signedMessage;
  }

  return JSON.stringify(signature);
}

export async function verifyCIDPinned(cid) {
  const response = await axios.get(`${PINATA_API_URL}/pinning/pinList`, {
    headers: pinataHeaders(),
    params: { hashContains: cid, status: "pinned" },
  });
  return response.data.count > 0;
}

export async function fetchMetadataFromIPFS(metadataCID) {
  const url = `${PINATA_GATEWAY}/${metadataCID}`;
  const response = await axios.get(url);
  return response.data;
}

export async function unpinFromIPFS(cid) {
  await axios.delete(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
    headers: pinataHeaders(),
  });
}
