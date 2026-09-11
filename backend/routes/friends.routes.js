const express = require('express');
const router = express.Router();

let friends = [
  {
    id: 'f1',
    name: 'Priya Sharma',
    username: 'priya_queen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    isOnline: true,
    level: 18,
    rank: 42,
    status: 'In Match: Ludo',
  },
  {
    id: 'f2',
    name: 'Kabir Mehta',
    username: 'kabir_grandmaster',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    isOnline: true,
    level: 22,
    rank: 12,
    status: 'Online',
  },
  {
    id: 'f3',
    name: 'Ananya Roy',
    username: 'ananya_uno',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    isOnline: false,
    level: 11,
    rank: 88,
    status: 'Last seen 2h ago',
  },
];

let friendRequests = [
  {
    id: 'req_1',
    sender: { id: 'u_101', name: 'Rahul Joshi', username: 'rahul_ludo_champ', level: 9 },
    createdAt: '2026-09-09T20:15:00Z',
  },
];

// ─── GET /friends ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  return res.success(friends, 'Friends list loaded');
});

// ─── GET /friends/requests ────────────────────────────────────────────────────
router.get('/requests', (req, res) => {
  return res.success(friendRequests, 'Friend requests loaded');
});

// ─── POST /friends/request ────────────────────────────────────────────────────
router.post('/request', (req, res) => {
  const { userId } = req.body;
  return res.success({ sent: true, userId }, 'Friend request sent');
});

// ─── POST /friends/request/:id/accept ─────────────────────────────────────────
router.post('/request/:id/accept', (req, res) => {
  const { id } = req.params;
  friendRequests = friendRequests.filter(r => r.id !== id);
  return res.success({ accepted: true, requestId: id }, 'Friend request accepted');
});

// ─── POST /friends/request/:id/decline ────────────────────────────────────────
router.post('/request/:id/decline', (req, res) => {
  const { id } = req.params;
  friendRequests = friendRequests.filter(r => r.id !== id);
  return res.success({ declined: true, requestId: id }, 'Friend request declined');
});

// ─── DELETE /friends/:id ──────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  friends = friends.filter(f => f.id !== id);
  return res.success({ removedId: id }, 'Friend removed successfully');
});

// ─── GET /friends/search ──────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const { q } = req.query;
  const searchResults = [
    { id: 'search_1', name: 'Dev Patel', username: 'dev_gamer_x', level: 15, isFriend: false },
    { id: 'search_2', name: 'Neha Gupta', username: 'neha_chess', level: 19, isFriend: false },
  ];
  return res.success(searchResults, 'Search results');
});

module.exports = router;
