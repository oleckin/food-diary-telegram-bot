import { env } from '../config/env.js';
import { supabase } from './supabase.js';

export async function uploadBuffer(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false
  });

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
  }

  return path;
}

export async function uploadToDefaultBucket(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  return uploadBuffer(env.SUPABASE_STORAGE_BUCKET, path, buffer, contentType);
}
