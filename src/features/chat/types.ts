export type MessageType = 'text' | 'image' | 'video' | 'file' | 'sticker' | 'emoji';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  type: MessageType;
  content: string;
  file_name: string | null;
  file_size: number | null;
  read_at: string | null;
  created_at: string;
}

export interface SendMessagePayload {
  receiverId: string;
  type: MessageType;
  content: string;
  fileName?: string;
  fileSize?: number;
}
