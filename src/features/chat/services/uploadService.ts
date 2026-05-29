import { supabase } from '@/lib/supabase';
import type { MessageType } from '../types';

const BUCKET = 'chat-uploads';

export type FileCategory = 'image' | 'video' | 'file';

const MAX_SIZES: Record<FileCategory, number> = {
  image: 10 * 1024 * 1024,   // 10 MB
  video: 50 * 1024 * 1024,   // 50 MB
  file:  25 * 1024 * 1024,   // 25 MB
};

export function getFileCategory(file: File): FileCategory {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

export function fileCategoryToMessageType(category: FileCategory): MessageType {
  if (category === 'image') return 'image';
  if (category === 'video') return 'video';
  return 'file';
}

export async function uploadChatFile(
  file: File,
  conversationId: string,
): Promise<string> {
  const category = getFileCategory(file);
  const maxSize = MAX_SIZES[category];

  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    throw new Error(
      `El archivo es muy grande. Máximo ${maxMB} MB para ${category === 'image' ? 'imágenes' : category === 'video' ? 'videos' : 'archivos'}.`,
    );
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${conversationId}/${uniqueName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
