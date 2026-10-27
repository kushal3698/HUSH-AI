import { EventEmitter } from 'events';

// Set ephemeral port 0 BEFORE evaluating server.js so it never collides with 3001
process.env.PORT = '0';
const { wss } = await import('../server.js');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-Memory Virtual Socket pair for ultra-fast, zero-network, sandbox-safe testing
class VirtualSocketPair {
  constructor() {
    this.serverWs = new EventEmitter();
    this.clientWs = new EventEmitter();

    this.serverWs.readyState = 1; // WebSocket.OPEN
    this.clientWs.readyState = 1;

    this.serverWs.send = (data) => {
      process.nextTick(() => {
        this.clientWs.emit('message', typeof data === 'string' ? data : data.toString());
      });
    };

    this.clientWs.send = (data) => {
      process.nextTick(() => {
        this.serverWs.emit('message', Buffer.from(typeof data === 'string' ? data : JSON.stringify(data)));
      });
    };

    this.clientWs.close = () => {
      this.serverWs.emit('close');
      this.clientWs.emit('close');
    };
  }
}

class TestClient {
  constructor(userId, alias, mood = 'general') {
    this.userId = userId;
    this.alias = alias;
    this.mood = mood;
    this.ws = null;
    this.room = null;
    this.progress = { myMessageCount: 0, strangerMessageCount: 0, thresholdRequired: 10, mediaUnlocked: false };
    this.receivedMessages = [];
    this.receivedMediaMessages = [];
    this.rejectedMedia = [];
    this.rejectedCalls = [];
    this.receivedCallSignals = [];
  }

  async connect() {
    const pair = new VirtualSocketPair();
    this.ws = pair.clientWs;

    this.ws.on('message', (raw) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString();
        const data = JSON.parse(text);

        if (data.type === 'MATCHED') {
          this.room = data;
          if (data.progress) this.progress = data.progress;
        } else if (data.type === 'CONVERSATION_PROGRESS') {
          this.progress = data.progress;
        } else if (data.type === 'NEW_MESSAGE') {
          this.receivedMessages.push(data);
        } else if (data.type === 'NEW_MEDIA_MESSAGE') {
          this.receivedMediaMessages.push(data);
        } else if (data.type === 'MEDIA_REJECTED') {
          this.rejectedMedia.push(data);
        } else if (data.type === 'CALL_REJECTED') {
          this.rejectedCalls.push(data);
        } else if (data.type === 'CALL_SIGNAL') {
          this.receivedCallSignals.push(data);
        }
      } catch (e) {
        console.error('Client parse error', e);
      }
    });

    // Register with server WebSocketServer
    wss.emit('connection', pair.serverWs);
    await delay(20);
  }

  joinQueue() {
    this.ws.send(JSON.stringify({
      type: 'JOIN_QUEUE',
      userId: this.userId,
      alias: this.alias,
      mood: this.mood
    }));
  }

  sendMessage(id, text, options = {}) {
    this.ws.send(JSON.stringify({
      type: 'SEND_MESSAGE',
      id,
      text,
      ...options
    }));
  }

  sendMedia(id, media, text = '') {
    this.ws.send(JSON.stringify({
      type: 'SEND_MEDIA',
      id,
      media,
      text
    }));
  }

  sendCallSignal(signalType, callType, payload = {}) {
    this.ws.send(JSON.stringify({
      type: 'CALL_SIGNAL',
      signalType,
      callType,
      payload,
      senderAlias: this.alias
    }));
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Complete End-to-End Verification of all 9 requirements
async function runTestSuite() {
  console.log('====================================================');
  console.log('  HUSH AI: Secure Mutual Threshold Test Suite       ');
  console.log('====================================================\n');

  let passedCount = 0;
  const totalTests = 9;

  try {
    // ----------------------------------------------------
    // Scenario 1: User A sends 9 qualifying messages, User B sends 10 -> Locked
    // ----------------------------------------------------
    console.log('--- TEST 1: User A sends 9 messages, User B sends 10 (Gated features must remain locked) ---');
    const userA = new TestClient('user_A_001', 'Alice', 'general');
    const userB = new TestClient('user_B_001', 'Bob', 'general');

    await userA.connect();
    await userB.connect();

    userA.joinQueue();
    userB.joinQueue();
    await delay(100);

    if (!userA.room || !userB.room) {
      throw new Error('Test 1 Failed: Users were not matched into a room.');
    }

    // User B sends 10 qualifying messages
    for (let i = 1; i <= 10; i++) {
      userB.sendMessage(`b_msg_${i}`, `Message from Bob #${i}`);
      await delay(20);
    }

    // User A sends 9 qualifying messages
    for (let i = 1; i <= 9; i++) {
      userA.sendMessage(`a_msg_${i}`, `Message from Alice #${i}`);
      await delay(20);
    }
    await delay(100);

    console.log(`[Status] User A progress: my=${userA.progress.myMessageCount}, stranger=${userA.progress.strangerMessageCount}, unlocked=${userA.progress.mediaUnlocked}`);
    console.log(`[Status] User B progress: my=${userB.progress.myMessageCount}, stranger=${userB.progress.strangerMessageCount}, unlocked=${userB.progress.mediaUnlocked}`);

    if (userA.progress.myMessageCount === 9 && 
        userA.progress.strangerMessageCount === 10 && 
        userA.progress.mediaUnlocked === false &&
        userB.progress.mediaUnlocked === false) {
      console.log('✅ TEST 1 PASSED: 9 vs 10 messages correctly keeps features locked.\n');
      passedCount++;
    } else {
      throw new Error(`TEST 1 FAILED: Expected unlocked=false, got A=${userA.progress.mediaUnlocked}, B=${userB.progress.mediaUnlocked}`);
    }

    // ----------------------------------------------------
    // Scenario 2: User A sends 10th qualifying message -> Unlocks for both
    // ----------------------------------------------------
    console.log('--- TEST 2: User A sends 10th qualifying message (Must unlock for both simultaneously) ---');
    userA.sendMessage('a_msg_10', 'Alice sends qualifying message 10!');
    await delay(100);

    console.log(`[Status] User A progress: my=${userA.progress.myMessageCount}, stranger=${userA.progress.strangerMessageCount}, unlocked=${userA.progress.mediaUnlocked}, justUnlocked=${userA.progress.justUnlocked}`);
    console.log(`[Status] User B progress: my=${userB.progress.myMessageCount}, stranger=${userB.progress.strangerMessageCount}, unlocked=${userB.progress.mediaUnlocked}, justUnlocked=${userB.progress.justUnlocked}`);

    if (userA.progress.myMessageCount === 10 &&
        userA.progress.strangerMessageCount === 10 &&
        userA.progress.mediaUnlocked === true &&
        userB.progress.mediaUnlocked === true) {
      console.log('✅ TEST 2 PASSED: 10th message unlocked features for both participants simultaneously.\n');
      passedCount++;
    } else {
      throw new Error(`TEST 2 FAILED: Expected both unlocked=true, got A=${userA.progress.mediaUnlocked}, B=${userB.progress.mediaUnlocked}`);
    }

    userA.close();
    userB.close();
    await delay(100);

    // ----------------------------------------------------
    // Scenario 3: User C sends 10 messages, User D sends 9 -> Locked
    // ----------------------------------------------------
    console.log('--- TEST 3: User C sends 10 messages, User D sends 9 (Asymmetric threshold must remain locked) ---');
    const userC = new TestClient('user_C_001', 'Charlie', 'general');
    const userD = new TestClient('user_D_001', 'Diana', 'general');

    await userC.connect();
    await userD.connect();

    userC.joinQueue();
    userD.joinQueue();
    await delay(100);

    for (let i = 1; i <= 10; i++) {
      userC.sendMessage(`c_msg_${i}`, `Message from Charlie #${i}`);
      await delay(20);
    }

    for (let i = 1; i <= 9; i++) {
      userD.sendMessage(`d_msg_${i}`, `Message from Diana #${i}`);
      await delay(20);
    }
    await delay(100);

    if (userC.progress.mediaUnlocked === false && userD.progress.mediaUnlocked === false) {
      console.log('✅ TEST 3 PASSED: 10 vs 9 messages correctly remains locked.\n');
      passedCount++;
    } else {
      throw new Error(`TEST 3 FAILED: Expected unlocked=false, got C=${userC.progress.mediaUnlocked}, D=${userD.progress.mediaUnlocked}`);
    }

    // ----------------------------------------------------
    // Scenario 4: Unauthorized media upload before threshold -> Backend rejects
    // ----------------------------------------------------
    console.log('--- TEST 4: Unauthorized media upload before threshold (Backend Security Enforcement) ---');
    userC.sendMedia('unauthorized_media_1', { type: 'image', url: 'https://example.com/forbidden.png' }, 'Secret photo');
    await delay(100);

    console.log(`[Status] User C rejected media events: ${userC.rejectedMedia.length}`);
    console.log(`[Status] User D received media messages: ${userD.receivedMediaMessages.length}`);

    if (userC.rejectedMedia.length > 0 && 
        userC.rejectedMedia[0].type === 'MEDIA_REJECTED' && 
        userD.receivedMediaMessages.length === 0) {
      console.log('✅ TEST 4 PASSED: Backend securely rejected unauthorized media upload before threshold.\n');
      passedCount++;
    } else {
      throw new Error('TEST 4 FAILED: Backend did not properly reject unauthorized media upload.');
    }

    // ----------------------------------------------------
    // Scenario 5: Unauthorized call before threshold -> Backend rejects
    // ----------------------------------------------------
    console.log('--- TEST 5: Unauthorized call before threshold (Backend Security Enforcement) ---');
    userD.sendCallSignal('offer', 'video', { sdp: 'fake-sdp' });
    await delay(100);

    console.log(`[Status] User D rejected call events: ${userD.rejectedCalls.length}`);
    console.log(`[Status] User C received call signals: ${userC.receivedCallSignals.length}`);

    if (userD.rejectedCalls.length > 0 && 
        userD.rejectedCalls[0].type === 'CALL_REJECTED' && 
        userC.receivedCallSignals.length === 0) {
      console.log('✅ TEST 5 PASSED: Backend securely rejected unauthorized call signaling before threshold.\n');
      passedCount++;
    } else {
      throw new Error('TEST 5 FAILED: Backend did not properly reject unauthorized call signal.');
    }

    // ----------------------------------------------------
    // Scenario 6: Retry same message ID -> Counter does NOT increment twice
    // ----------------------------------------------------
    console.log('--- TEST 6: Message deduplication (Retried message ID must not increment count) ---');
    const countBeforeRetry = userD.progress.myMessageCount;
    // Resend d_msg_1 which was already sent
    userD.sendMessage('d_msg_1', 'Message from Diana #1 RETRY');
    await delay(100);

    const countAfterRetry = userD.progress.myMessageCount;
    console.log(`[Status] User D count before retry: ${countBeforeRetry}, after retry: ${countAfterRetry}`);

    if (countAfterRetry === countBeforeRetry) {
      console.log('✅ TEST 6 PASSED: Retried message ID did not increment counter.\n');
      passedCount++;
    } else {
      throw new Error(`TEST 6 FAILED: Counter incremented on retry! before=${countBeforeRetry}, after=${countAfterRetry}`);
    }

    // ----------------------------------------------------
    // Scenario 7: Non-qualifying messages (whitespace, AI, attachment, reactions, edits) do NOT count
    // ----------------------------------------------------
    console.log('--- TEST 7: Non-qualifying message rules (whitespace, AI, attachments, reactions, edits) ---');
    const startCount = userD.progress.myMessageCount;

    // Send whitespace-only
    userD.sendMessage('d_msg_ws', '     ');
    await delay(20);
    // Send AI suggested
    userD.sendMessage('d_msg_ai', 'AI suggested starter', { isAiSuggested: true });
    await delay(20);
    // Send attachment flag
    userD.sendMessage('d_msg_att', 'attachment', { isAttachment: true });
    await delay(20);
    // Send reaction flag
    userD.sendMessage('d_msg_react', '👍', { isReaction: true });
    await delay(20);
    // Send edit flag
    userD.sendMessage('d_msg_edit', 'Edited message', { isEdit: true });
    await delay(100);

    const endCount = userD.progress.myMessageCount;
    console.log(`[Status] User D count before non-qualifying tests: ${startCount}, after: ${endCount}`);

    if (endCount === startCount) {
      console.log('✅ TEST 7 PASSED: Whitespace, AI suggestions, attachments, reactions, and edits did not count.\n');
      passedCount++;
    } else {
      throw new Error(`TEST 7 FAILED: Non-qualifying messages increased count from ${startCount} to ${endCount}`);
    }

    userC.close();
    userD.close();
    await delay(100);

    // ----------------------------------------------------
    // Scenario 8: New chat room starts with fresh counters
    // ----------------------------------------------------
    console.log('--- TEST 8: New chat room isolation (Must start with fresh 0/10 counters) ---');
    const userE = new TestClient('user_E_001', 'Evan', 'general');
    const userF = new TestClient('user_F_001', 'Fiona', 'general');

    await userE.connect();
    await userF.connect();

    userE.joinQueue();
    userF.joinQueue();
    await delay(100);

    console.log(`[Status] Room ${userE.room?.roomId} initialized with:`);
    console.log(`  User E: my=${userE.progress.myMessageCount}, stranger=${userE.progress.strangerMessageCount}, unlocked=${userE.progress.mediaUnlocked}`);
    console.log(`  User F: my=${userF.progress.myMessageCount}, stranger=${userF.progress.strangerMessageCount}, unlocked=${userF.progress.mediaUnlocked}`);

    if (userE.progress.myMessageCount === 0 && 
        userE.progress.strangerMessageCount === 0 && 
        userE.progress.mediaUnlocked === false &&
        userF.progress.myMessageCount === 0 && 
        userF.progress.strangerMessageCount === 0 && 
        userF.progress.mediaUnlocked === false) {
      console.log('✅ TEST 8 PASSED: New chat room initialized with fresh 0/10 counters and locked state.\n');
      passedCount++;
    } else {
      throw new Error('TEST 8 FAILED: New room did not have fresh zero counters.');
    }

    // ----------------------------------------------------
    // Scenario 9: Both users see the exact same authoritative unlock status
    // ----------------------------------------------------
    console.log('--- TEST 9: Authoritative synchronization across both participants ---');
    for (let i = 1; i <= 10; i++) {
      userE.sendMessage(`e_msg_${i}`, `Message from Evan #${i}`);
      userF.sendMessage(`f_msg_${i}`, `Message from Fiona #${i}`);
      await delay(20);
    }
    await delay(100);

    console.log(`[Status] User E: my=${userE.progress.myMessageCount}, stranger=${userE.progress.strangerMessageCount}, unlocked=${userE.progress.mediaUnlocked}`);
    console.log(`[Status] User F: my=${userF.progress.myMessageCount}, stranger=${userF.progress.strangerMessageCount}, unlocked=${userF.progress.mediaUnlocked}`);

    if (userE.progress.myMessageCount === 10 &&
        userE.progress.strangerMessageCount === 10 &&
        userE.progress.mediaUnlocked === true &&
        userF.progress.myMessageCount === 10 &&
        userF.progress.strangerMessageCount === 10 &&
        userF.progress.mediaUnlocked === true) {
      console.log('✅ TEST 9 PASSED: Both users received matching authoritative progress and unlock status.\n');
      passedCount++;
    } else {
      throw new Error('TEST 9 FAILED: Authoritative progress was not synchronized between participants.');
    }

    userE.close();
    userF.close();

    console.log('====================================================');
    console.log(`  ALL ${passedCount}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
    console.log('====================================================');
    return true;

  } catch (error) {
    console.error('\n❌ Test Suite Failure:', error.message);
    return false;
  }
}

runTestSuite().then((success) => {
  process.exit(success ? 0 : 1);
});
