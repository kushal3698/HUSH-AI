import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3001;

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

const wss = new WebSocketServer({ server });

// In-memory state
// waitingQueue: Array<{ socket, userId, alias, mood, joinedAt }>
let waitingQueue = [];

// activeRooms: Record<roomId, { userA: { socket, userId, alias }, userB: { socket, userId, alias }, mood }>
const activeRooms = {};

// socketToRoom: Map<socket, roomId>
const socketToRoom = new Map();

function send(socket, data) {
  if (socket.readyState === WebSocket.OPEN) {
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

function tryMatchUsers() {
  if (waitingQueue.length < 2) return;

  // 1. Try to find pairs with the exact same mood
  for (let i = 0; i < waitingQueue.length; i++) {
    const userA = waitingQueue[i];

    for (let j = i + 1; j < waitingQueue.length; j++) {
      const userB = waitingQueue[j];

      // Disallow matching identical socket connections
      if (userA.socket === userB.socket) continue;

      // Match if same mood OR either selected 'general'
      const sameMood = userA.mood === userB.mood;
      const eitherGeneral = userA.mood === 'general' || userB.mood === 'general';
      const waitedLong = (Date.now() - userA.joinedAt > 3000) || (Date.now() - userB.joinedAt > 3000);

      if (sameMood || eitherGeneral || waitedLong) {
        // Remove both from queue
        waitingQueue.splice(j, 1);
        waitingQueue.splice(i, 1);

        const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        
        activeRooms[roomId] = {
          userA: { socket: userA.socket, userId: userA.userId, alias: userA.alias, messageCount: 0 },
          userB: { socket: userB.socket, userId: userB.userId, alias: userB.alias, messageCount: 0 },
          processedMessageIds: new Set(),
          mediaUnlocked: false,
          mood: userA.mood,
          createdAt: Date.now()
        };

        socketToRoom.set(userA.socket, roomId);
        socketToRoom.set(userB.socket, roomId);

        console.log(`[MATCH CREATED] Room ${roomId}: ${userA.alias} <---> ${userB.alias} (${userA.mood})`);

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
          mood: userA.mood,
          progress: initialProgress
        });

        send(userB.socket, {
          type: 'MATCHED',
          roomId,
          strangerId: userA.userId,
          strangerAlias: userA.alias,
          mood: userB.mood,
          progress: initialProgress
        });

        broadcastQueueStatus();
        return tryMatchUsers(); // Check if more pairs can be matched
      }
    }
  }
}

wss.on('connection', (ws) => {
  console.log('[CLIENT CONNECTED]');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'JOIN_QUEUE': {
          // Remove if already in queue or existing room
          leaveAnyRoom(ws);
          waitingQueue = waitingQueue.filter(entry => entry.socket !== ws);

          waitingQueue.push({
            socket: ws,
            userId: data.userId,
            alias: data.alias,
            mood: data.mood,
            joinedAt: Date.now()
          });

          console.log(`[QUEUE JOIN] ${data.alias} waiting for "${data.mood}". Total waiting: ${waitingQueue.length}`);
          broadcastQueueStatus();
          tryMatchUsers();
          break;
        }

        case 'CANCEL_QUEUE': {
          waitingQueue = waitingQueue.filter(entry => entry.socket !== ws);
          console.log(`[QUEUE CANCEL] Socket left queue. Total waiting: ${waitingQueue.length}`);
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
          const rawText = typeof data.text === 'string' ? data.text : '';
          const trimmedText = rawText.trim();

          const isAlreadyProcessed = msgId ? room.processedMessageIds.has(msgId) : false;
          const isAi = Boolean(data.isAiSuggested);
          const isAttachment = Boolean(data.isAttachment);
          const isReaction = Boolean(data.isReaction);
          const isEdit = Boolean(data.isEdit);
          const isGame = Boolean(data.isGame);

          if (msgId && !isAlreadyProcessed) {
            room.processedMessageIds.add(msgId);
            // Qualifying message check: non-empty trimmed text, not AI, not attachment, not reaction, not edit, not game
            if (trimmedText.length > 0 && !isAi && !isAttachment && !isReaction && !isEdit && !isGame) {
              senderUser.messageCount = (senderUser.messageCount || 0) + 1;
            }
          }

          // Evaluate threshold: both users must independently have >= 10 messages
          const wasUnlocked = room.mediaUnlocked;
          const nowUnlocked = (room.userA.messageCount >= 10) && (room.userB.messageCount >= 10);
          room.mediaUnlocked = nowUnlocked;

          // Forward the text message to the partner
          send(partnerSocket, {
            type: 'NEW_MESSAGE',
            id: data.id,
            text: data.text,
            timestamp: Date.now(),
            isAiSuggested: isAi
          });

          // Send immediate delivery acknowledgment to sender
          send(ws, {
            type: 'MESSAGE_DELIVERED',
            id: data.id
          });

          // Authoritative progress broadcast to both participants
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

          // BACKEND SECURITY CHECK: Media threshold enforcement
          if (!room.mediaUnlocked) {
            console.warn(`[SECURITY REJECT] Unauthorized media sharing attempt in room ${roomId}. Threshold not met.`);
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

          // BACKEND SECURITY CHECK: Calling threshold enforcement
          if (!room.mediaUnlocked) {
            console.warn(`[SECURITY REJECT] Unauthorized call signal attempt in room ${roomId}. Threshold not met.`);
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
              message: `Mutual reveal requires at least 3 messages each from both participants.`
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
    console.log('[CLIENT DISCONNECTED]');
    waitingQueue = waitingQueue.filter(entry => entry.socket !== ws);
    leaveAnyRoom(ws);
    broadcastQueueStatus();
  });
});

function leaveAnyRoom(ws) {
  const roomId = socketToRoom.get(ws);
  if (!roomId) return;

  const room = activeRooms[roomId];
  if (room) {
    const partnerSocket = room.userA.socket === ws ? room.userB.socket : room.userA.socket;
    send(partnerSocket, {
      type: 'PARTNER_LEFT'
    });

    socketToRoom.delete(room.userA.socket);
    socketToRoom.delete(room.userB.socket);
    delete activeRooms[roomId];
    console.log(`[ROOM CLOSED] ${roomId} ended.`);
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HUSH AI Real-Time WebSocket Server listening on http://0.0.0.0:${PORT}`);
});

export { wss, activeRooms, waitingQueue, socketToRoom, server };
