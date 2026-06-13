/**
 * Grocery Sales — Google Apps Script Web App backend
 * =================================================================
 * This is the secure sync layer. It runs ON Google's servers, bound to your
 * spreadsheet, so the only credentials that can touch the Sheet stay here —
 * nothing secret ever ships in the React/GitHub Pages bundle.
 *
 * SETUP (one time)
 * ----------------
 * 1. Open your Google Sheet (the one with the 📊 Summary + Jan..Dec tabs).
 * 2. Extensions ▸ Apps Script. Delete the sample, paste this whole file.
 * 3. Set GOOGLE_CLIENT_ID and ALLOWED_EMAIL below.
 * 4. Deploy ▸ New deployment ▸ type "Web app".
 *      - Execute as:  Me
 *      - Who has access:  Anyone   (access is gated by Google Sign-In, below)
 *    Copy the /exec URL it gives you.
 * 5. In the web app .env, set VITE_SHEETS_API to that URL, plus the SAME
 *    VITE_GOOGLE_CLIENT_ID and VITE_ALLOWED_EMAIL (see .env.example).
 *
 * SECURITY: every write/read request must carry a signed Google ID token. This
 * script verifies it on Google's servers and rejects anything whose email is
 * not ALLOWED_EMAIL — so even though the endpoint is "Anyone", only you can use
 * it. The spreadsheet itself stays private (only this script, running as you,
 * can touch it).
 *
 * Geometry (matches the workbook): each month tab has its header on row 7 and
 * one row per day starting at row 8. Columns A..L:
 *   A Day  B Date  C Cash  D Online  E Card  F TotalSales
 *   G SalonCash  H SalonOnline  I SalonTotal  J Expenses  K ToSuppliers  L NetProfit
 */

// OAuth 2.0 "Web application" client id (same as the app's VITE_GOOGLE_CLIENT_ID).
var GOOGLE_CLIENT_ID = '137443458233-iskijv5vs8uvc3hp2pilo814l8ias8hk.apps.googleusercontent.com';

// Every Google account allowed to use the app. Add or remove emails here.
var ALLOWED_EMAILS = [
  'brownlegend0001@gmail.com',
  'SECOND_EMAIL_HERE@gmail.com'   // ← replace with the 2nd account (or delete this line)
];

// How long a device stays signed in after one Google login.
var SESSION_DAYS = 30;

var HEADER_ROW = 7;
var FIRST_DATA_ROW = 8;
var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---- HTTP entry points ----------------------------------------------------

function doGet(e) {
  // Allows a quick browser health check: ...exec?action=ping
  return handle(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return handle(body);
}

function handle(req) {
  try {
    if (req.action === 'ping') return ok({ pong: true });
    if (req.action === 'login') return ok(login(req.idToken)); // mint device session
    assertAuth(req); // accepts a device session OR a Google ID token

    switch (req.action) {
      case 'getMonth':   return ok(getMonth(req.month));
      case 'getSummary': return ok(getSummary());
      case 'saveDay':    return ok(saveDay(req.month, Number(req.day), req.values || {}));
      case 'clearDay':   return ok(clearDay(req.month, Number(req.day)));
      default:           return fail('Unknown action: ' + req.action);
    }
  } catch (err) {
    return fail(err && err.message ? err.message : String(err));
  }
}

// ---- Auth -----------------------------------------------------------------
//
// Two credential types:
//   • Google ID token  – short-lived, from the browser sign-in. Exchanged once
//     at the `login` action for a session.
//   • Device session   – a 30-day HMAC token this script signs, so the app
//     stays signed in without hitting Google on every launch.
// `assertAuth` accepts either, so old and new app builds both keep working.

function allowedLower() {
  return ALLOWED_EMAILS.map(function (e) { return String(e).toLowerCase().trim(); });
}

// Verify a Google ID token and return its email if it's an allowed account.
function verifyIdToken(idToken) {
  if (!idToken) throw new Error('Sign-in required');
  var resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) throw new Error('Invalid sign-in');
  var info = JSON.parse(resp.getContentText());

  if (String(info.aud) !== String(GOOGLE_CLIENT_ID)) throw new Error('Wrong audience');
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') {
    throw new Error('Bad issuer');
  }
  if (String(info.email_verified) !== 'true') throw new Error('Email not verified');
  if (Number(info.exp) * 1000 < Date.now()) throw new Error('Sign-in expired');
  var email = String(info.email).toLowerCase();
  if (allowedLower().indexOf(email) < 0) throw new Error('Not authorized');
  return info.email;
}

// Exchange a verified ID token for a long-lived device session.
function login(idToken) {
  return mintSession(verifyIdToken(idToken));
}

// A per-script secret, auto-generated and stored once. Delete the
// SESSION_SECRET script property to log every device out.
function sessionSecret() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SESSION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SESSION_SECRET', s); }
  return s;
}

function b64url(input) { return Utilities.base64EncodeWebSafe(input).replace(/=+$/, ''); }
function hmac(body) { return b64url(Utilities.computeHmacSha256Signature(body, sessionSecret())); }

function mintSession(email) {
  var expSec = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  var body = b64url(JSON.stringify({ email: email, exp: expSec }));
  return { session: body + '.' + hmac(body), email: email, exp: expSec };
}

// Accept either a device session or a raw Google ID token.
function assertAuth(req) {
  if (req.session) return assertSession(req.session);
  if (req.idToken) { verifyIdToken(req.idToken); return; }
  throw new Error('Sign-in required');
}

function assertSession(session) {
  var parts = String(session).split('.');
  if (parts.length !== 2) throw new Error('Bad session');
  if (hmac(parts[0]) !== parts[1]) throw new Error('Invalid session');
  var payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  if (Number(payload.exp) * 1000 < Date.now()) throw new Error('Session expired');
  if (allowedLower().indexOf(String(payload.email).toLowerCase()) < 0) throw new Error('Not authorized');
}

// ---- Spreadsheet helpers --------------------------------------------------

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheetFor(month) {
  var sh = ss().getSheetByName(month);
  if (!sh) throw new Error('No tab named "' + month + '"');
  return sh;
}

function num(v) {
  if (v === '' || v === null || v === undefined) return 0;
  var n = Number(v);
  return isFinite(n) ? n : 0;
}

function yearOf() {
  // Pull the year from the Summary title if present, else current year.
  try {
    var t = ss().getSheetByName('📊 Summary').getRange('A1').getDisplayValue();
    var m = t.match(/(\d{4})/);
    if (m) return Number(m[1]);
  } catch (e) {}
  return new Date().getFullYear();
}

function lastDay(monthIndex) {
  return new Date(yearOf(), monthIndex + 1, 0).getDate();
}

// Read every day row for a month into plain objects.
function getMonth(month) {
  var sh = sheetFor(month);
  var mi = MONTHS.indexOf(month);
  var n = lastDay(mi);
  var rng = sh.getRange(FIRST_DATA_ROW, 1, n, 12).getValues();
  var out = [];
  for (var i = 0; i < n; i++) {
    var r = rng[i];
    out.push({
      date: i + 1,
      weekday: WEEKDAYS[new Date(yearOf(), mi, i + 1).getDay()],
      cash: num(r[2]),
      online: num(r[3]),
      card: num(r[4]),
      salonCash: num(r[6]),
      salonOnline: num(r[7]),
      expenses: num(r[9]),
      toSuppliers: num(r[10])
    });
  }
  return out;
}

// Write one day's inputs AND the derived columns, so the Sheet is correct even
// if a tab is missing its formulas.
function saveDay(month, day, v) {
  var sh = sheetFor(month);
  var mi = MONTHS.indexOf(month);
  if (day < 1 || day > lastDay(mi)) throw new Error('Bad day: ' + day);
  var row = HEADER_ROW + day; // row 7 + day

  var cash = num(v.cash), online = num(v.online), card = num(v.card);
  var sCash = num(v.salonCash), sOnline = num(v.salonOnline);
  var exp = num(v.expenses), sup = num(v.toSuppliers);

  var totalSales = cash + online + card;
  var salonTotal = sCash + sOnline;
  var netProfit = totalSales + salonTotal - exp - sup;

  // Ensure Day + Date labels are present.
  sh.getRange(row, 1).setValue(WEEKDAYS[new Date(yearOf(), mi, day).getDay()]);
  sh.getRange(row, 2).setValue(day);

  // C..L in one write.
  sh.getRange(row, 3, 1, 10).setValues([[
    cash, online, card, totalSales, sCash, sOnline, salonTotal, exp, sup, netProfit
  ]]);

  return { month: month, day: day, totalSales: totalSales, salonTotal: salonTotal, netProfit: netProfit };
}

function clearDay(month, day) {
  return saveDay(month, day, {});
}

// Roll all 12 months up for the dashboard / Summary view.
function getSummary() {
  var months = [];
  var year = { totalSales: 0, cash: 0, online: 0, card: 0, salon: 0, expenses: 0, toSuppliers: 0, netProfit: 0 };

  for (var m = 0; m < MONTHS.length; m++) {
    var days = getMonth(MONTHS[m]);
    var t = { totalSales: 0, cash: 0, online: 0, card: 0, salon: 0, expenses: 0, toSuppliers: 0, netProfit: 0 };
    var active = 0, best = null, worst = null;

    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      var ts = d.cash + d.online + d.card;
      var st = d.salonCash + d.salonOnline;
      var np = ts + st - d.expenses - d.toSuppliers;
      if (ts > 0 || st > 0 || d.expenses > 0 || d.toSuppliers > 0) {
        active++;
        if (!best || ts > best.value) best = { date: d.date, value: ts };
        if (!worst || ts < worst.value) worst = { date: d.date, value: ts };
      }
      t.totalSales += ts; t.cash += d.cash; t.online += d.online; t.card += d.card;
      t.salon += st; t.expenses += d.expenses; t.toSuppliers += d.toSuppliers; t.netProfit += np;
    }

    var denom = t.cash + t.online + t.card;
    months.push({
      month: MONTHS[m],
      totalSales: t.totalSales,
      dailyAvg: active ? t.totalSales / active : 0,
      activeDays: active,
      bestDay: best, worstDay: worst,
      cash: t.cash, online: t.online, card: t.card,
      salon: t.salon, expenses: t.expenses, toSuppliers: t.toSuppliers,
      netProfit: t.netProfit,
      cashPct: denom ? (t.cash / denom) * 100 : 0,
      onlinePct: denom ? (t.online / denom) * 100 : 0
    });

    for (var k in year) year[k] += t[k];
  }

  return { year: yearOf(), yearTotal: year, months: months };
}

// ---- JSON responses -------------------------------------------------------

function ok(result) { return json({ ok: true, result: result }); }
function fail(error) { return json({ ok: false, error: error }); }

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
