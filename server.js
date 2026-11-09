import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = process.env.PORT !== undefined ? Number(process.env.PORT) : 3001;

// Minimal HTTP server for health checks & ping
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({
    status: 'HUSH AI Matchmaking & Messaging Server Running',
    waitingCount: waitingQueue.length,
    activeRooms: Object.keys(activeRooms).length
  }));
});

// 10MB maxPayload to support base64 media after unlock while preventing DoS memory crashes
const wss = new WebSocketServer({ server, maxPayload: 10 * 1024 * 1024 });

// In-memory state
let waitingQueue = [];
const activeRooms = {};
const socketToRoom = new Map();
const referralStore = new Map();

function send(socket, data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcastQueueStatus() {
  waitingQueue.forEach((entry, idx) => {
    send(entry.socket, {
      type: 'QUEUE_STATUS',
      position: idx + 1,
      totalWaiting: waitingQueue.length
    });
  });
}

function createRoomAndNotify(userA, userB, options = {}) {
  const isDirectReconnect = Boolean(options.isDirectReconnect);
  const roomId = isDirectReconnect
    ? `room_reconnect_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    : `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const roomReconnectCode = options.reconnectCode || ('HUSH-' + Math.floor(100000 + Math.random() * 900000));

  activeRooms[roomId] = {
    userA: {
      socket: userA.socket,
      userId: userA.userId,
      alias: userA.alias,
      messageCount: 0,
      city: userA.city,
      age: userA.age,
      gender: userA.gender,
      isVip: Boolean(userA.isVip),
      isOnline: true,
      disconnectTimer: null
    },
    userB: {
      socket: userB.socket,
      userId: userB.userId,
      alias: userB.alias,
      messageCount: 0,
      city: userB.city,
      age: userB.age,
      gender: userB.gender,
      isVip: Boolean(userB.isVip),
      isOnline: true,
      disconnectTimer: null
    },
    processedMessageIds: new Set(),
    mediaUnlocked: false,
    mood: userA.mood || 'general',
    createdAt: Date.now(),
    reconnectCode: roomReconnectCode
  };

  socketToRoom.set(userA.socket, roomId);
  socketToRoom.set(userB.socket, roomId);

  const initialProgress = {
    myMessageCount: 0,
    strangerMessageCount: 0,
    thresholdRequired: 10,
    mediaUnlocked: false
  };

  send(userA.socket, {
    type: 'MATCHED',
    roomId,
    strangerId: userB.userId,
    strangerAlias: userB.alias,
    mood: userA.mood || 'general',
    strangerCity: userB.city,
    strangerAge: userB.age,
    strangerGender: userB.gender,
    reconnectCode: roomReconnectCode,
    ...(isDirectReconnect ? { isDirectReconnect: true } : {}),
    strangerIsVip: Boolean(userB.isVip),
    progress: initialProgress
  });

  send(userB.socket, {
    type: 'MATCHED',
    roomId,
    strangerId: userA.userId,
    strangerAlias: userA.alias,
    mood: userB.mood || 'general',
    strangerCity: userA.city,
    strangerAge: userA.age,
    strangerGender: userA.gender,
    reconnectCode: roomReconnectCode,
    ...(isDirectReconnect ? { isDirectReconnect: true } : {}),
    strangerIsVip: Boolean(userA.isVip),
    progress: initialProgress
  });
}

function tryMatchUsers() {
  // Purge any closed sockets before matching
  waitingQueue = waitingQueue.filter(u => u.socket && u.socket.readyState === WebSocket.OPEN);
  if (waitingQueue.length < 2) return;

  // 0. Priority: Match users who entered the exact same Reconnect Code
  for (let i = 0; i < waitingQueue.length; i++) {
    const userA = waitingQueue[i];
    if (!userA.reconnectCode) continue;

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const userB = waitingQueue[j];
      if (userA.socket === userB.socket || (userA.userId && userA.userId === userB.userId)) continue;

      if (userB.reconnectCode && userA.reconnectCode.trim().toUpperCase() === userB.reconnectCode.trim().toUpperCase()) {
        waitingQueue.splice(j, 1);
        waitingQueue.splice(i, 1);

        createRoomAndNotify(userA, userB, {
          reconnectCode: userA.reconnectCode,
          isDirectReconnect: true
        });

        console.log(`[RECONNECT MATCH] Code ${userA.reconnectCode}: ${userA.alias} <---> ${userB.alias}`);
        broadcastQueueStatus();
        return tryMatchUsers();
      }
    }
  }

  // Prioritize VIP users while preserving FIFO order within tiers
  waitingQueue.sort((a, b) => {
    const vipDiff = (b.isVip ? 1 : 0) - (a.isVip ? 1 : 0);
    return vipDiff !== 0 ? vipDiff : a.joinedAt - b.joinedAt;
  });

  // 1. Standard & VIP Filtered Matchmaking
  for (let i = 0; i < waitingQueue.length; i++) {
    const userA = waitingQueue[i];
    if (userA.reconnectCode) continue;

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const userB = waitingQueue[j];
      if (userA.socket === userB.socket || userB.reconnectCode) continue;
      if (userA.userId && userA.userId === userB.userId) continue;

      // Check VIP Gender filters
      if (userA.isVip && userA.targetGender && userA.targetGender !== 'any') {
        const bGender = String(userB.gender || '').toLowerCase();
        if (bGender !== userA.targetGender && !bGender.includes(userA.targetGender)) continue;
      }
      if (userB.isVip && userB.targetGender && userB.targetGender !== 'any') {
        const aGender = String(userA.gender || '').toLowerCase();
        if (aGender !== userB.targetGender && !aGender.includes(userB.targetGender)) continue;
      }

      // Check VIP City filters
      if (userA.isVip && userA.targetCity) {
        const bCity = String(userB.city || '').toLowerCase();
        if (!bCity.includes(userA.targetCity)) continue;
      }
      if (userB.isVip && userB.targetCity) {
        const aCity = String(userA.city || '').toLowerCase();
        if (!aCity.includes(userB.targetCity)) continue;
      }

      const sameMood = userA.mood === userB.mood;
      const eitherGeneral = userA.mood === 'general' || userB.mood === 'general';
      const waitedLong = (Date.now() - userA.joinedAt > 3000) || (Date.now() - userB.joinedAt > 3000);

      if (sameMood || eitherGeneral || waitedLong) {
        waitingQueue.splice(j, 1);
        waitingQueue.splice(i, 1);

        createRoomAndNotify(userA, userB);

        broadcastQueueStatus();
        return tryMatchUsers();
      }
    }
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'JOIN_QUEUE': {
          ws.userId = data.userId;
          leaveAnyRoom(ws);
          waitingQueue = waitingQueue.filter(entry => entry.socket !== ws && entry.userId !== data.userId);

          waitingQueue.push({
            socket: ws,
            userId: data.userId,
            alias: String(data.alias || 'Anonymous').slice(0, 40),
            mood: data.mood || 'general',
            city: data.city ? String(data.city).slice(0, 50) : null,
            age: data.age || null,
            gender: data.gender || null,
            isVip: Boolean(data.isVip),
            targetGender: data.targetGender ? String(data.targetGender).toLowerCase() : null,
            targetCity: data.targetCity ? String(data.targetCity).trim().toLowerCase() : null,
            reconnectCode: data.reconnectCode ? String(data.reconnectCode).trim().toUpperCase() : null,
            joinedAt: Date.now()
          });

          broadcastQueueStatus();
          tryMatchUsers();
          break;
        }

        case 'IDENTIFY_USER': {
          if (data.userId) {
            ws.userId = data.userId;
            const count = referralStore.get(data.userId)?.size || 0;
            send(ws, {
              type: 'REFERRAL_COUNT_UPDATED',
              referralCount: count,
              unlockedVip: count >= 10
            });
          }
          break;
        }

        case 'REGISTER_REFERRAL': {
          const { referrerId, visitorId } = data;
          if (referrerId && visitorId && referrerId !== visitorId) {
            if (!referralStore.has(referrerId)) {
              referralStore.set(referrerId, new Set());
            }
            const set = referralStore.get(referrerId);
            set.add(visitorId);
            const count = set.size;

            for (const client of wss.clients) {
              if (client.readyState === WebSocket.OPEN && client.userId === referrerId) {
                send(client, {
                  type: 'REFERRAL_COUNT_UPDATED',
                  referralCount: count,
                  unlockedVip: count >= 10
                });
              }
            }
          }
          break;
        }

        case 'CANCEL_QUEUE': {
          waitingQueue = waitingQueue.filter(entry => entry.socket !== ws);
          broadcastQueueStatus();
          break;
        }

        case 'SEND_MESSAGE': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const isUserA = room.userA.socket === ws;
          const senderUser = isUserA ? room.userA : room.userB;
          const partnerUser = isUserA ? room.userB : room.userA;
          const partnerSocket = partnerUser.socket;

          const msgId = typeof data.id === 'string' ? data.id.trim() : '';
          const rawText = typeof data.text === 'string' ? data.text.slice(0, 4000) : '';
          const trimmedText = rawText.trim();

          const isAlreadyProcessed = msgId ? room.processedMessageIds.has(msgId) : false;
          const isAi = Boolean(data.isAiSuggested);
          const isAttachment = Boolean(data.isAttachment);
          const isReaction = Boolean(data.isReaction);
          const isEdit = Boolean(data.isEdit);
          const isGame = Boolean(data.isGame);

          if (msgId && !isAlreadyProcessed) {
            room.processedMessageIds.add(msgId);
            if (trimmedText.length > 0 && !isAi && !isAttachment && !isReaction && !isEdit && !isGame) {
              senderUser.messageCount = (senderUser.messageCount || 0) + 1;
            }
          }

          const wasUnlocked = room.mediaUnlocked;
          const nowUnlocked = (room.userA.messageCount >= 10) && (room.userB.messageCount >= 10);
          room.mediaUnlocked = nowUnlocked;

          send(partnerSocket, {
            type: 'NEW_MESSAGE',
            id: data.id,
            text: rawText,
            timestamp: Date.now(),
            isAiSuggested: isAi
          });

          send(ws, {
            type: 'MESSAGE_DELIVERED',
            id: data.id
          });

          send(room.userA.socket, {
            type: 'CONVERSATION_PROGRESS',
            progress: {
              myMessageCount: room.userA.messageCount,
              strangerMessageCount: room.userB.messageCount,
              thresholdRequired: 10,
              mediaUnlocked: nowUnlocked,
              justUnlocked: !wasUnlocked && nowUnlocked
            }
          });

          send(room.userB.socket, {
            type: 'CONVERSATION_PROGRESS',
            progress: {
              myMessageCount: room.userB.messageCount,
              strangerMessageCount: room.userA.messageCount,
              thresholdRequired: 10,
              mediaUnlocked: nowUnlocked,
              justUnlocked: !wasUnlocked && nowUnlocked
            }
          });
          break;
        }

        case 'GET_PROGRESS': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const isUserA = room.userA.socket === ws;
          const myUser = isUserA ? room.userA : room.userB;
          const partnerUser = isUserA ? room.userB : room.userA;

          send(ws, {
            type: 'CONVERSATION_PROGRESS',
            progress: {
              myMessageCount: myUser.messageCount || 0,
              strangerMessageCount: partnerUser.messageCount || 0,
              thresholdRequired: 10,
              mediaUnlocked: Boolean(room.mediaUnlocked)
            }
          });
          break;
        }

        case 'SEND_MEDIA': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];

          if (!room.mediaUnlocked) {
            const isUserA = room.userA.socket === ws;
            const myUser = isUserA ? room.userA : room.userB;
            const partnerUser = isUserA ? room.userB : room.userA;

            send(ws, {
              type: 'MEDIA_REJECTED',
              error: 'Media sharing is locked. Both participants must independently send at least 10 messages each to unlock media and calls.',
              progress: {
                myMessageCount: myUser.messageCount || 0,
                strangerMessageCount: partnerUser.messageCount || 0,
                thresholdRequired: 10,
                mediaUnlocked: false
              }
            });
            return;
          }

          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;
          const mediaMsgId = data.id || `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

          send(partnerSocket, {
            type: 'NEW_MEDIA_MESSAGE',
            id: mediaMsgId,
            media: data.media,
            text: data.text || '',
            timestamp: Date.now()
          });

          send(ws, {
            type: 'MESSAGE_DELIVERED',
            id: mediaMsgId
          });
          break;
        }

        case 'CALL_SIGNAL': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];

          if (!room.mediaUnlocked) {
            send(ws, {
              type: 'CALL_REJECTED',
              error: 'Audio and video calls are locked. Both participants must independently send at least 10 messages each to unlock media and calls.',
              callType: data.callType
            });
            return;
          }

          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;
          send(partnerSocket, {
            type: 'CALL_SIGNAL',
            signalType: data.signalType,
            callType: data.callType,
            payload: data.payload,
            senderAlias: data.senderAlias
          });
          break;
        }

        case 'READ_RECEIPT': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'MESSAGE_READ',
            id: data.id
          });
          break;
        }

        case 'TYPING': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'PARTNER_TYPING',
            isTyping: Boolean(data.isTyping)
          });
          break;
        }

        case 'PRESENCE': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const isUserA = room.userA && room.userA.socket === ws;
          if (isUserA) {
            room.userA.isOnline = data.status !== 'offline';
          } else if (room.userB && room.userB.socket === ws) {
            room.userB.isOnline = data.status !== 'offline';
          }

          const partnerSocket = isUserA ? room.userB?.socket : room.userA?.socket;
          if (partnerSocket) {
            send(partnerSocket, {
              type: 'PARTNER_STATUS',
              status: data.status === 'offline' ? 'offline' : 'online'
            });
          }
          break;
        }

        case 'REJOIN_ROOM': {
          const { roomId, userId } = data;
          if (!roomId || !activeRooms[roomId]) {
            send(ws, { type: 'ROOM_EXPIRED' });
            return;
          }

          const room = activeRooms[roomId];
          const isUserA = room.userA && room.userA.userId === userId;
          const isUserB = room.userB && room.userB.userId === userId;

          if (!isUserA && !isUserB) {
            send(ws, { type: 'ROOM_EXPIRED' });
            return;
          }

          const rejoiningUser = isUserA ? room.userA : room.userB;
          const partnerUser = isUserA ? room.userB : room.userA;

          if (rejoiningUser.disconnectTimer) {
            clearTimeout(rejoiningUser.disconnectTimer);
            rejoiningUser.disconnectTimer = null;
          }

          if (rejoiningUser.socket && rejoiningUser.socket !== ws) {
            socketToRoom.delete(rejoiningUser.socket);
          }

          rejoiningUser.socket = ws;
          rejoiningUser.isOnline = true;
          socketToRoom.set(ws, roomId);

          send(ws, {
            type: 'ROOM_RESTORED',
            roomId,
            progress: {
              myMessageCount: rejoiningUser.messageCount || 0,
              strangerMessageCount: partnerUser.messageCount || 0,
              thresholdRequired: 10,
              mediaUnlocked: Boolean(room.mediaUnlocked)
            }
          });

          if (partnerUser?.socket) {
            send(partnerUser.socket, {
              type: 'PARTNER_STATUS',
              status: 'online'
            });
          }
          break;
        }

        case 'LAUNCH_GAME': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'GAME_LAUNCHED',
            gameData: data.gameData
          });
          break;
        }

        case 'VOTE_GAME': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'GAME_VOTED',
            gameId: data.gameId,
            userId: data.userId,
            choice: data.choice
          });
          break;
        }

        case 'REVEAL_REQUEST': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const aCount = room.userA.messageCount || 0;
          const bCount = room.userB.messageCount || 0;

          if (aCount < 3 || bCount < 3) {
            send(ws, {
              type: 'REVEAL_ERROR',
              message: 'Mutual reveal requires at least 3 messages each from both participants.'
            });
            return;
          }

          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;
          send(partnerSocket, {
            type: 'REVEAL_REQUESTED',
            payload: data.payload
          });
          break;
        }

        case 'REVEAL_RESPONSE': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'REVEAL_RESPONDED',
            payload: data.payload
          });
          break;
        }

        case 'SAVE_CONNECTION': {
          const roomId = socketToRoom.get(ws);
          if (!roomId || !activeRooms[roomId]) return;

          const room = activeRooms[roomId];
          const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;

          send(partnerSocket, {
            type: 'CONNECTION_SAVE_OFFERED',
            senderAlias: data.senderAlias,
            reconnectCode: data.reconnectCode
          });
          break;
        }

        case 'LEAVE_CHAT': {
          leaveAnyRoom(ws);
          break;
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    waitingQueue = waitingQueue.filter(entry => entry.socket !== ws);
    handleSocketClose(ws);
    broadcastQueueStatus();
  });
});

function handleSocketClose(ws) {
  const roomId = socketToRoom.get(ws);
  if (!roomId || !activeRooms[roomId]) return;

  const room = activeRooms[roomId];
  const isUserA = room.userA && room.userA.socket === ws;
  const isUserB = room.userB && room.userB.socket === ws;

  const disconnectingUser = isUserA ? room.userA : isUserB ? room.userB : null;
  const remainingUser = isUserA ? room.userB : isUserB ? room.userA : null;

  socketToRoom.delete(ws);

  if (!disconnectingUser) return;

  disconnectingUser.isOnline = false;
  disconnectingUser.socket = null;

  // If both users are disconnected, clean up immediately
  if (!room.userA?.socket && !room.userB?.socket) {
    if (room.userA?.disconnectTimer) clearTimeout(room.userA.disconnectTimer);
    if (room.userB?.disconnectTimer) clearTimeout(room.userB.disconnectTimer);
    delete activeRooms[roomId];
    return;
  }

  if (remainingUser?.socket) {
    send(remainingUser.socket, {
      type: 'PARTNER_STATUS',
      status: 'offline'
    });
  }

  // Per-user 60-second grace timer
  if (disconnectingUser.disconnectTimer) {
    clearTimeout(disconnectingUser.disconnectTimer);
  }

  disconnectingUser.disconnectTimer = setTimeout(() => {
    const currentRoom = activeRooms[roomId];
    if (currentRoom && !disconnectingUser.socket) {
      if (remainingUser?.socket) {
        send(remainingUser.socket, { type: 'PARTNER_LEFT' });
        socketToRoom.delete(remainingUser.socket);
      }
      if (currentRoom.userA?.disconnectTimer) clearTimeout(currentRoom.userA.disconnectTimer);
      if (currentRoom.userB?.disconnectTimer) clearTimeout(currentRoom.userB.disconnectTimer);
      delete activeRooms[roomId];
    }
  }, 60000);
}

function leaveAnyRoom(ws) {
  const roomId = socketToRoom.get(ws);
  if (!roomId) return;

  const room = activeRooms[roomId];
  if (room) {
    if (room.userA?.disconnectTimer) clearTimeout(room.userA.disconnectTimer);
    if (room.userB?.disconnectTimer) clearTimeout(room.userB.disconnectTimer);

    const partnerSocket = room.userA?.socket === ws ? room.userB?.socket : room.userA?.socket;
    if (partnerSocket) {
      send(partnerSocket, { type: 'PARTNER_LEFT' });
      socketToRoom.delete(partnerSocket);
    }

    if (room.userA?.socket) socketToRoom.delete(room.userA.socket);
    if (room.userB?.socket) socketToRoom.delete(room.userB.socket);
    delete activeRooms[roomId];
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HUSH AI Real-Time WebSocket Server listening on http://0.0.0.0:${PORT}`);
});

export { wss, activeRooms, waitingQueue, socketToRoom, server };
