'use strict';
const root = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pd = s => String(s ?? '').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const fa = n => Number(n || 0).toLocaleString('fa-IR');
const size = b => !b ? '—' : b >= 1048576 ? pd((b / 1048576).toFixed(1).replace(/\.0$/, '')) + ' مگابایت' : fa(Math.max(1, Math.round(b / 1024))) + ' کیلوبایت';
const fdate = d => { try { return new Date(d).toLocaleDateString('fa-IR-u-ca-persian'); } catch (e) { return ''; } };
let CFG, ASSETS = {}, Q = '';

const good = a => (a.versions || []).filter(v => ASSETS[v.file]).sort((x, y) => y.code - x.code);
const vis = () => CFG.apps.filter(a => a.published !== false && good(a).length);
const total = a => good(a).reduce((s, v) => s + ASSETS[v.file].count, 0);
const img = p => 'images/' + encodeURI(p);
const icon = a => a.icon ? `<img class="ic" src="${esc(img(a.icon))}" alt="${esc(a.name)}" width="64" height="64" loading="lazy">` : `<span class="ic ph">${esc([...a.name][0] || '؟')}</span>`;

function setMeta(title, desc, ldObj) {
  document.title = title;
  const m = document.querySelector('meta[name=description]'); if (m) m.content = desc;
  const t = document.querySelector('meta[property="og:title"]'); if (t) t.content = title;
  let s = document.getElementById('ld'); if (s) s.remove();
  if (ldObj) { s = document.createElement('script'); s.id = 'ld'; s.type = 'application/ld+json'; s.textContent = JSON.stringify(ldObj); document.head.append(s); }
}
async function load() {
  CFG = await (await fetch('apps.json?' + Date.now())).json();
  document.getElementById('logo').textContent = CFG.site.name;
  const key = 'rel:' + CFG.site.repo; let rel = null;
  try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 6e5) rel = c.d; } catch (e) {}
  if (!rel) {
    const r = await fetch(`https://api.github.com/repos/${CFG.site.repo}/releases?per_page=100`);
    if (!r.ok) throw new Error('GitHub ' + r.status);
    rel = (await r.json()).map(x => ({ assets: (x.assets || []).map(a => ({ name: a.name, url: a.browser_download_url, size: a.size, count: a.download_count })) }));
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: rel })); } catch (e) {}
  }
  rel.forEach(r => r.assets.forEach(a => { ASSETS[a.name] = a; }));
}
function card(a) {
  const v = good(a)[0];
  return `<article class="card"><a class="cl" href="#/app/${esc(a.slug)}">${icon(a)}<h3>${esc(a.name)}</h3></a><p>${esc(a.short)}</p><div class="meta"><span>${esc(a.category)}</span><span>${size(ASSETS[v.file].size)}</span><span>${fa(total(a))} دانلود</span></div><a class="btn sm" rel="nofollow noopener" href="${esc(ASSETS[v.file].url)}">دانلود رایگان</a></article>`;
}
function home(cat) {
  const all = vis(), cats = [...new Set(all.map(a => a.category))].sort(); let list = all;
  if (cat) list = list.filter(a => a.category === cat);
  if (Q) { const t = Q.toLowerCase(); list = list.filter(a => (a.name + ' ' + a.short + ' ' + a.category).toLowerCase().includes(t)); }
  setMeta(cat ? `${cat} | ${CFG.site.name}` : `${CFG.site.name} | دانلود رایگان APK`, 'دانلود مستقیم و رایگان فایل APK برنامه‌های اندروید با توضیحات فارسی، نسخه و حجم دقیق.');
  root.innerHTML = `<section class="hero"><h1>${esc(cat || CFG.site.name)}</h1><p>دانلود مستقیم و رایگان برنامه‌های اندروید، بدون ثبت‌نام و بدون پرداخت</p></section><nav class="chips"><a class="${cat ? '' : 'on'}" href="#/">همه</a>${cats.map(c => `<a class="${c === cat ? 'on' : ''}" href="#/?cat=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</nav>${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<p class="empty">برنامه‌ای پیدا نشد.</p>'}`;
}
function appView(slug) {
  const a = vis().find(x => x.slug === slug);
  if (!a) { setMeta('برنامه پیدا نشد', ''); root.innerHTML = '<p class="empty">این برنامه پیدا نشد. <a href="#/">بازگشت به صفحه اصلی</a></p>'; return; }
  const vs = good(a), v = vs[0], as = ASSETS[v.file];
  setMeta(`دانلود ${a.name} برای اندروید (نسخه ${pd(v.name)}) | ${CFG.site.name}`, (a.short || a.desc || '').slice(0, 155), {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: a.name, description: a.short || a.name, applicationCategory: 'MobileApplication',
    operatingSystem: 'Android ' + v.minAndroid + '+', softwareVersion: v.name, downloadUrl: as.url, offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' }
  });
  root.innerHTML = `<article class="app"><header class="ah">${icon(a)}<div><h1>${esc(a.name)}</h1><p>${esc(a.short)}</p><a class="btn" rel="nofollow noopener" href="${esc(as.url)}">دانلود رایگان APK — نسخه ${pd(esc(v.name))}</a></div></header>
  <dl class="facts"><div><dt>دسته‌بندی</dt><dd><a href="#/?cat=${encodeURIComponent(a.category)}">${esc(a.category)}</a></dd></div><div><dt>نسخه</dt><dd>${pd(esc(v.name))}</dd></div><div><dt>حجم</dt><dd>${size(as.size)}</dd></div><div><dt>حداقل اندروید</dt><dd>${pd(esc(v.minAndroid))}</dd></div><div><dt>تعداد دانلود</dt><dd>${fa(total(a))}</dd></div><div><dt>آخرین بروزرسانی</dt><dd>${fdate(v.date)}</dd></div></dl>
  ${(a.shots || []).length ? `<div class="shots">${a.shots.map(f => `<img src="${esc(img(f))}" alt="تصویر ${esc(a.name)}" loading="lazy">`).join('')}</div>` : ''}
  <section><h2>معرفی ${esc(a.name)}</h2>${String(a.desc || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</section>
  <section><h2>نسخه‌ها</h2><ul class="vers">${vs.map(x => `<li><div><strong>نسخه ${pd(esc(x.name))}</strong> <span>${fdate(x.date)} · ${size(ASSETS[x.file].size)} · اندروید ${pd(esc(x.minAndroid))}+ · ${fa(ASSETS[x.file].count)} دانلود</span>${x.changelog ? `<p>${esc(x.changelog).replace(/\n/g, '<br>')}</p>` : ''}</div><a class="btn sm" rel="nofollow noopener" href="${esc(ASSETS[x.file].url)}">دانلود</a></li>`).join('')}</ul></section></article>`;
}
function check() {
  setMeta('بررسی فایل‌ها', '');
  const rows = [];
  CFG.apps.forEach(a => (a.versions || []).forEach(v => rows.push(`<tr><td>${esc(a.name)}</td><td>${esc(v.name)}</td><td dir="ltr">${esc(v.file)}</td><td class="${ASSETS[v.file] ? 'ok' : 'no'}">${ASSETS[v.file] ? 'سالم' : 'فایل در Releases پیدا نشد (در سایت نمایش داده نمی‌شود)'}</td></tr>`)));
  root.innerHTML = `<h1>بررسی فایل‌ها</h1><p class="hint">هر نسخه باید فایلی با <b>همین نام دقیق</b> در بخش Releases مخزن داشته باشد.</p><div class="tw"><table><tr><th>برنامه</th><th>نسخه</th><th>نام فایل</th><th>وضعیت</th></tr>${rows.join('') || '<tr><td colspan="4">برنامه‌ای در apps.json نیست.</td></tr>'}</table></div>`;
}
function route() {
  const h = location.hash.slice(1) || '/', i = h.indexOf('?'), p = i < 0 ? h : h.slice(0, i), qs = new URLSearchParams(i < 0 ? '' : h.slice(i + 1)), m = /^\/app\/([\w-]+)/.exec(p);
  window.scrollTo(0, 0);
  if (m) return appView(m[1]); if (p === '/check') return check(); home(qs.get('cat') || '');
}
document.getElementById('q').addEventListener('input', e => { Q = e.target.value.trim(); if (location.hash && location.hash !== '#/' && !location.hash.startsWith('#/?')) location.hash = '#/'; else route(); });
window.addEventListener('hashchange', () => { if (CFG) route(); });
load().then(route).catch(e => { root.innerHTML = `<p class="empty">بارگذاری ناموفق بود (${esc(e.message)}). اگر apps.json را تازه ویرایش کرده‌اید، احتمالاً یک ویرگول یا گیومه جا افتاده است. چند دقیقه بعد دوباره امتحان کنید.</p>`; });
