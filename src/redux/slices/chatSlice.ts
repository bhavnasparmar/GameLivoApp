import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>; // roomId -> messages
  activeRoomId: string | null;
  isLoading: boolean;
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
  activeRoomId: null,
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    setRoomMessages: (state, action: PayloadAction<{ roomId: string; messages: ChatMessage[] }>) => {
      state.messages[action.payload.roomId] = action.payload.messages;
    },
    receiveMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { roomId } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId].push(action.payload);
    },
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
    },
    markRoomRead: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find(c => c.id === action.payload);
      if (conv) conv.unreadCount = 0;
    },
  },
});

export const { setConversations, setRoomMessages, receiveMessage, setActiveRoom, markRoomRead } = chatSlice.actions;
export default chatSlice.reducer;
