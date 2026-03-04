import Mux from "@mux/mux-node";
import { eq, desc } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { muxAssets } from "../drizzle/schema";

function getMuxClient() {
  return new Mux({
    tokenId: ENV.muxTokenId,
    tokenSecret: ENV.muxTokenSecret,
  });
}

export async function createDirectUpload(filename: string) {
  const mux = getMuxClient();

  let upload;
  try {
    upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "smart",
      },
      cors_origin: "*",
    });
  } catch (err) {
    throw new Error(`Failed to create Mux direct upload: ${err instanceof Error ? err.message : String(err)}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(muxAssets).values({
    muxAssetId: upload.id, // placeholder — real asset ID arrives via webhook/poll
    uploadId: upload.id,
    filename,
    status: "preparing",
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
    assetId: null,
  };
}

export async function getAssetStatus(uploadId: string) {
  const mux = getMuxClient();

  let upload;
  try {
    upload = await mux.video.uploads.retrieve(uploadId);
  } catch (err) {
    throw new Error(`Failed to retrieve Mux upload ${uploadId}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (upload.asset_id) {
    let asset;
    try {
      asset = await mux.video.assets.retrieve(upload.asset_id);
    } catch (err) {
      throw new Error(`Failed to retrieve Mux asset ${upload.asset_id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    const mappedStatus: "preparing" | "ready" | "errored" =
      asset.status === "ready"
        ? "ready"
        : asset.status === "errored"
        ? "errored"
        : "preparing";

    await db
      .update(muxAssets)
      .set({
        muxAssetId: upload.asset_id,
        playbackId: asset.playback_ids?.[0]?.id ?? null,
        status: mappedStatus,
        duration: Math.round(asset.duration ?? 0),
      })
      .where(eq(muxAssets.uploadId, uploadId));
  }

  const rows = await db
    .select()
    .from(muxAssets)
    .where(eq(muxAssets.uploadId, uploadId));

  return rows[0] ?? null;
}

export async function listAssets() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(muxAssets)
    .orderBy(desc(muxAssets.createdAt));
}

export async function deleteAsset(muxAssetId: string) {
  const mux = getMuxClient();

  try {
    await mux.video.assets.delete(muxAssetId);
  } catch (err) {
    console.error(`Failed to delete Mux asset ${muxAssetId} from API:`, err instanceof Error ? err.message : err);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(muxAssets).where(eq(muxAssets.muxAssetId, muxAssetId));
}
