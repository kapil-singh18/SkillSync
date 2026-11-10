/**
 * tests/module4.test.js
 *
 * End-to-end API tests for Module 4 — Matching & Connections.
 * Credentials are read from env vars; none are hardcoded.
 *
 * Run from: server/ directory
 */

require('dotenv').config();
const http = require('http');

const BASE = 'localhost';
const PORT = 5000;

let passed = 0;
let failed = 0;

const check = (label, ok, detail) => {
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    if (detail) console.error(`    →`, JSON.stringify(detail).slice(0, 300));
    failed++;
  }
};

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: BASE,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  const devPass = process.env.DEV_SEED_PASSWORD;

  // ── Login as admin (Arjun is student, so use two dev users for cross-tests)
  console.log('\n── Auth ────────────────────────────────────────────────────────');

  const arjunLogin = await request('POST', '/api/auth/login', { email: 'arjun.dev@skillsync.test', password: devPass });
  const arjunToken = arjunLogin.body?.token;
  check('Arjun (student) login', !!arjunToken, arjunLogin.body);

  const zaraLogin = await request('POST', '/api/auth/login', { email: 'zara.dev@skillsync.test', password: devPass });
  const zaraToken = zaraLogin.body?.token;
  check('Zara (student) login', !!zaraToken);

  const nehaLogin = await request('POST', '/api/auth/login', { email: 'neha.mentor@skillsync.test', password: devPass });
  const nehaToken = nehaLogin.body?.token;
  check('Neha (mentor) login', !!nehaToken);

  const jamesLogin = await request('POST', '/api/auth/login', { email: 'james.mentor@skillsync.test', password: devPass });
  const jamesToken = jamesLogin.body?.token;
  check('James (mentor) login', !!jamesToken);

  const zaraId = zaraLogin.body?.user?._id;
  const arjunId = arjunLogin.body?.user?._id;
  const nehaId = nehaLogin.body?.user?._id;
  const jamesId = jamesLogin.body?.user?._id;

  // ── Discover ──────────────────────────────────────────────────────────────
  console.log('\n── GET /api/matches/discover ───────────────────────────────────');

  const peerDiscover = await request('GET', '/api/matches/discover?type=peer', null, arjunToken);
  check('Discover peers → 200', peerDiscover.status === 200, peerDiscover.body);
  check('Returns results array', Array.isArray(peerDiscover.body?.results));
  check('needsProfile is false (Arjun has skills)', peerDiscover.body?.needsProfile === false);
  check('Results have score field', peerDiscover.body?.results?.[0]?.score !== undefined);
  check('Results sorted descending', (() => {
    const r = peerDiscover.body?.results || [];
    for (let i = 1; i < r.length; i++) if (r[i].score > r[i - 1].score) return false;
    return true;
  })());
  check('No email in results', !peerDiscover.body?.results?.some((r) => r.user?.email));
  check('Arjun not in his own results', !peerDiscover.body?.results?.some((r) => String(r.user?._id) === String(arjunId)));
  check('Admins not in results', !peerDiscover.body?.results?.some((r) => r.user?.role === 'admin'));
  check('Results have insight field', peerDiscover.body?.results?.[0]?.insight !== undefined);

  const mentorDiscover = await request('GET', '/api/matches/discover?type=mentor', null, arjunToken);
  check('Discover mentors → 200', mentorDiscover.status === 200, mentorDiscover.body);
  check('All mentor results are mentors', mentorDiscover.body?.results?.every((r) => r.user?.role === 'mentor'));
  check('No email in mentor results', !mentorDiscover.body?.results?.some((r) => r.user?.email));

  // ── Dismiss ───────────────────────────────────────────────────────────────
  console.log('\n── Dismiss ─────────────────────────────────────────────────────');

  const dismissRes = await request('POST', `/api/matches/${zaraId}/dismiss`, null, arjunToken);
  check('Dismiss Zara → 200', dismissRes.status === 200, dismissRes.body);

  const afterDismiss = await request('GET', '/api/matches/discover?type=peer', null, arjunToken);
  check('Dismissed user not in results', !afterDismiss.body?.results?.some((r) => String(r.user?._id) === String(zaraId)));

  const clearRes = await request('DELETE', '/api/matches/dismissed', null, arjunToken);
  check('Clear dismissed → 200', clearRes.status === 200, clearRes.body);

  const afterClear = await request('GET', '/api/matches/discover?type=peer', null, arjunToken);
  check('After reset, Zara is back', afterClear.body?.results?.some((r) => String(r.user?._id) === String(zaraId)));

  // ── Self-dismiss guard ────────────────────────────────────────────────────
  const selfDismiss = await request('POST', `/api/matches/${arjunId}/dismiss`, null, arjunToken);
  check('Cannot dismiss self → 400', selfDismiss.status === 400, selfDismiss.body);

  // ── Connections: send peer request ────────────────────────────────────────
  console.log('\n── POST /api/connections ───────────────────────────────────────');

  const sendReq = await request('POST', '/api/connections', { userId: zaraId, type: 'peer', message: 'Hey Zara!' }, arjunToken);
  check('Arjun sends peer request to Zara → 201', sendReq.status === 201, sendReq.body);
  const connId = sendReq.body?.connection?._id;
  check('Connection returned', !!connId);

  // ── Duplicate request blocked ─────────────────────────────────────────────
  const dupReq = await request('POST', '/api/connections', { userId: zaraId, type: 'peer' }, arjunToken);
  check('Duplicate request → 409', dupReq.status === 409, dupReq.body);

  // ── Self-request blocked ──────────────────────────────────────────────────
  const selfReq = await request('POST', '/api/connections', { userId: arjunId, type: 'peer' }, arjunToken);
  check('Self-request → 400', selfReq.status === 400, selfReq.body);

  // ── Mentorship from non-mentor blocked ────────────────────────────────────
  const nonMentorMentorship = await request('POST', '/api/connections', { userId: zaraId, type: 'mentorship' }, arjunToken);
  check('Mentorship to non-mentor → 400', nonMentorMentorship.status === 400, nonMentorMentorship.body);

  // ── Status ────────────────────────────────────────────────────────────────
  console.log('\n── GET /api/connections/status/:userId ─────────────────────────');

  const statusArjun = await request('GET', `/api/connections/status/${zaraId}`, null, arjunToken);
  check('Status → pending_sent (Arjun perspective)', statusArjun.body?.status === 'pending_sent', statusArjun.body);

  const statusZara = await request('GET', `/api/connections/status/${arjunId}`, null, zaraToken);
  check('Status → pending_received (Zara perspective)', statusZara.body?.status === 'pending_received', statusZara.body);

  // ── Non-recipient cannot accept ───────────────────────────────────────────
  const badAccept = await request('PUT', `/api/connections/${connId}/accept`, null, arjunToken);
  check('Requester cannot accept own request → 403', badAccept.status === 403, badAccept.body);

  // ── Accept ────────────────────────────────────────────────────────────────
  console.log('\n── Accept / My Network ─────────────────────────────────────────');

  const acceptRes = await request('PUT', `/api/connections/${connId}/accept`, null, zaraToken);
  check('Zara accepts → 200', acceptRes.status === 200, acceptRes.body);
  check('Status is now accepted', acceptRes.body?.connection?.status === 'accepted');

  // Both users appear in each other's My Network
  const arjunNetwork = await request('GET', '/api/connections?status=accepted', null, arjunToken);
  const zaraNetwork = await request('GET', '/api/connections?status=accepted', null, zaraToken);
  check('Arjun sees Zara in network', arjunNetwork.body?.connections?.some((c) => {
    const ids = [String(c.requester?._id || c.requester), String(c.recipient?._id || c.recipient)];
    return ids.includes(String(zaraId));
  }));
  check('Zara sees Arjun in network', zaraNetwork.body?.connections?.some((c) => {
    const ids = [String(c.requester?._id || c.requester), String(c.recipient?._id || c.recipient)];
    return ids.includes(String(arjunId));
  }));
  check('No email in network response', !arjunNetwork.body?.connections?.some((c) => c.requester?.email || c.recipient?.email));

  // ── Requests tabs ─────────────────────────────────────────────────────────
  console.log('\n── Incoming / Outgoing ─────────────────────────────────────────');

  // Send a new request (Arjun → Neha mentorship)
  const mentorReq = await request('POST', '/api/connections', { userId: nehaId, type: 'mentorship', message: 'Please mentor me!' }, arjunToken);
  check('Arjun sends mentorship request to Neha → 201', mentorReq.status === 201, mentorReq.body);
  const mentorConnId = mentorReq.body?.connection?._id;

  const nehaIncoming = await request('GET', '/api/connections/requests/incoming', null, nehaToken);
  check('Neha sees incoming mentorship request', nehaIncoming.body?.requests?.some((r) => String(r._id) === String(mentorConnId)));

  const arjunOutgoing = await request('GET', '/api/connections/requests/outgoing', null, arjunToken);
  check('Arjun sees outgoing mentorship request', arjunOutgoing.body?.requests?.some((r) => String(r._id) === String(mentorConnId)));

  // ── Decline & 7-day cooldown ──────────────────────────────────────────────
  console.log('\n── Decline & Cooldown ──────────────────────────────────────────');

  const declineRes = await request('PUT', `/api/connections/${mentorConnId}/decline`, null, nehaToken);
  check('Neha declines → 200', declineRes.status === 200, declineRes.body);

  // Immediately trying again should be blocked (7-day cooldown)
  const cooldownReq = await request('POST', '/api/connections', { userId: nehaId, type: 'mentorship' }, arjunToken);
  check('Re-request within 7 days → 429', cooldownReq.status === 429, cooldownReq.body);

  // ── Cancel ────────────────────────────────────────────────────────────────
  console.log('\n── Cancel ──────────────────────────────────────────────────────');

  // Liam sends to James then cancels
  const liamLogin = await request('POST', '/api/auth/login', { email: 'liam.dev@skillsync.test', password: devPass });
  const liamToken = liamLogin.body?.token;
  const liamId = liamLogin.body?.user?._id;

  const liamReq = await request('POST', '/api/connections', { userId: jamesId, type: 'mentorship' }, liamToken);
  const liamConnId = liamReq.body?.connection?._id;
  check('Liam sends request to James → 201', liamReq.status === 201, liamReq.body);

  const cancelRes = await request('PUT', `/api/connections/${liamConnId}/cancel`, null, liamToken);
  check('Liam cancels → 200', cancelRes.status === 200, cancelRes.body);

  // Non-requester cannot cancel
  const badCancel = await request('PUT', `/api/connections/${connId}/cancel`, null, zaraToken);
  check('Non-requester cannot cancel → 403', badCancel.status === 403, badCancel.body);

  // ── Remove ────────────────────────────────────────────────────────────────
  console.log('\n── Remove connection ───────────────────────────────────────────');

  const removeRes = await request('DELETE', `/api/connections/${connId}`, null, arjunToken);
  check('Arjun removes connection with Zara → 200', removeRes.status === 200, removeRes.body);

  // Third party cannot remove
  const thirdPartyRemove = await request('DELETE', `/api/connections/${connId}`, null, liamToken);
  check('Third party cannot remove → 404 or 403', [403, 404].includes(thirdPartyRemove.status), thirdPartyRemove.body);

  // ── Unauthenticated ───────────────────────────────────────────────────────
  console.log('\n── Auth guards ─────────────────────────────────────────────────');

  const noToken = await request('GET', '/api/matches/discover?type=peer', null, null);
  check('Discover without token → 401', noToken.status === 401);

  const noTokenConn = await request('GET', '/api/connections', null, null);
  check('Connections without token → 401', noTokenConn.status === 401);

  // ── Invalid ObjectId ──────────────────────────────────────────────────────
  const badId = await request('GET', '/api/connections/status/notanid', null, arjunToken);
  check('Status with invalid ID → 422', badId.status === 422, badId.body);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test run crashed:', err.message);
  process.exit(1);
});

