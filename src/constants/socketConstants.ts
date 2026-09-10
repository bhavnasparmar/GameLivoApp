// ─── Socket Event Constants ───────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  CONNECT_ERROR: 'connect_error',

  // Lobby
  LOBBY_JOIN: 'lobby:join',
  LOBBY_LEAVE: 'lobby:leave',
  LOBBY_UPDATE: 'lobby:update',
  LOBBY_PLAYER_READY: 'lobby:playerReady',
  LOBBY_START_GAME: 'lobby:startGame',

  // Game
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_MOVE: 'game:move',
  GAME_TURN: 'game:turn',
  GAME_END: 'game:end',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_TIMEOUT: 'game:timeout',

  // Player
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',
  PLAYER_RECONNECT: 'player:reconnect',
  PLAYER_DISCONNECT: 'player:disconnect',

  // Chat
  CHAT_JOIN_ROOM: 'chat:joinRoom',
  CHAT_LEAVE_ROOM: 'chat:leaveRoom',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',

  // Friends
  FRIEND_ONLINE: 'friend:online',
  FRIEND_OFFLINE: 'friend:offline',
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPTED: 'friend:accepted',
  FRIEND_GAME_INVITE: 'friend:gameInvite',

  // Notification
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
