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
  LOBBY_PLAYER_READY: 'lobby:player_ready',
  LOBBY_START_GAME: 'lobby:start_game',

  // Matchmaking (Quick Match)
  MATCH_QUEUE_JOIN: 'match:queue_join',
  MATCH_QUEUE_LEAVE: 'match:queue_leave',
  MATCH_FOUND: 'match:found',
  MATCH_DRAW_OFFER: 'match:draw_offer',
  MATCH_DRAW_RESPONSE: 'match:draw_response',
  MATCH_RESIGN: 'match:resign',

  // Game
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_MOVE: 'game:move',
  GAME_TURN: 'game:turn',
  GAME_OVER: 'game:over',
  GAME_END: 'game:end',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_TIMEOUT: 'game:timeout',
  GAME_EMOTE: 'game:emote',

  // Player
  PLAYER_JOIN: 'player:joined',
  PLAYER_LEAVE: 'player:left',
  PLAYER_RECONNECT: 'player:reconnected',
  PLAYER_DISCONNECT: 'player:disconnected',

  // Chat
  CHAT_JOIN_ROOM: 'chat:join_room',
  CHAT_LEAVE_ROOM: 'chat:leave_room',
  CHAT_MESSAGE: 'chat:send_message',
  CHAT_TYPING: 'chat:typing',

  // Friends
  FRIEND_ONLINE: 'friend:online',
  FRIEND_OFFLINE: 'friend:offline',
  FRIEND_REQUEST: 'friend:request',
  FRIEND_ACCEPTED: 'friend:accepted',
  FRIEND_GAME_INVITE: 'friend:game_invite',

  // Notification
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
