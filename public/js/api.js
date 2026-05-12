let _currentUser = null;

(async function loadUser() {
  try {
    const r = await fetch('/api/auth/me');
    const { user } = await r.json();
    _currentUser = user;
    if (user) {
      const el = document.getElementById('menuUser');
      if (el) el.textContent = user.isGuest ? `GUEST: ${user.username}` : `SIGNED IN: ${user.username}`;
    }
  } catch(e) {}
})();

function _fmtT(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');}

function renderEndLeaderboard(prefix, data) {
  const el = document.getElementById(prefix+'Board');
  if (!el) return;
  if (!data || !data.top10) {
    el.innerHTML = '<div class="lb-empty">Scores unavailable</div>';
    return;
  }
  const {rank, total, top10, scoreId, inTop10} = data;
  let html = `<div class="lb-rank">YOUR RANK &nbsp;<span>#${rank}</span>&nbsp; OF ${total}</div>`;
  html += '<table class="lb-table"><thead><tr><th>#</th><th>NAME</th><th>TIME</th><th>KILLS</th><th></th></tr></thead><tbody>';
  top10.forEach((row, i) => {
    const isYou = row.id === scoreId;
    const cls = isYou ? ' class="lb-you"' : '';
    const wonMark = row.won ? '<span class="lb-win">✦</span>' : '';
    const displayRank = inTop10 ? i+1 : (i < top10.length-1 ? i+1 : rank);
    const sep = !inTop10 && i === top10.length-2 ? '<tr class="lb-sep"><td colspan="5">· · ·</td></tr>' : '';
    html += `${sep}<tr${cls}><td>${displayRank}</td><td>${row.username}</td><td>${_fmtT(row.time)}</td><td>${row.kills}</td><td>${wonMark}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
  el.style.animation = 'fadeUp .4s cubic-bezier(.22,.68,0,1.2) both';
}

async function submitScore(won) {
  if (!_currentUser) return null;
  try {
    const r = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time:   Math.floor(gameTime),
        kills,
        level:  pl.level,
        damage: Math.floor(totalDmg),
        xp:     totalXp,
        dps:    Math.floor(totalDmg / Math.max(1, gameTime)),
        won
      })
    });
    return await r.json();
  } catch(e) { return null; }
}
