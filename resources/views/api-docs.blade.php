<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>API Documentation — Sistem Penggajian Guru</title>
<style>
    :root {
        color-scheme: dark;
        --bg: #070b16;
        --bg-soft: #0b1122;
        --panel: #0e1526;
        --panel-2: #121b31;
        --border: #1d2740;
        --border-soft: #16203a;
        --text: #e6ebf5;
        --muted: #8b98b5;
        --faint: #5d6a88;
        --accent: #6d8bff;
        --accent-2: #a78bfa;
        --get: #34d399;
        --post: #60a5fa;
        --put: #fbbf24;
        --patch: #f472b6;
        --delete: #f87171;
        --mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 84px; }
    body {
        margin: 0; background: var(--bg); color: var(--text);
        font: 15px/1.65 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: var(--mono); }

    /* ---------- Header ---------- */
    .site-header {
        position: sticky; top: 0; z-index: 40;
        display: flex; align-items: center; gap: 14px;
        height: 60px; padding: 0 22px;
        background: rgba(7, 11, 22, .82); backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-soft);
    }
    .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
    .brand-mark {
        width: 32px; height: 32px; border-radius: 9px; flex: none;
        display: grid; place-items: center; font-weight: 800; font-size: 12px; letter-spacing: .03em; color: #fff;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        box-shadow: 0 4px 18px rgba(109, 139, 255, .35);
    }
    .brand-title { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-sub { color: var(--faint); font-size: 12.5px; margin-left: 2px; white-space: nowrap; }
    .header-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--border); background: var(--panel); color: var(--muted);
    }
    .pill.version { color: var(--accent); border-color: rgba(109, 139, 255, .4); background: rgba(109, 139, 255, .08); }
    .header-link {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600;
        border: 1px solid var(--border); background: var(--panel); color: var(--text);
    }
    .header-link:hover { border-color: var(--accent); text-decoration: none; }
    .nav-toggle { display: none; }

    /* ---------- Shell ---------- */
    .shell { display: flex; align-items: flex-start; max-width: 1480px; margin: 0 auto; }
    .sidebar {
        position: sticky; top: 60px; flex: none;
        width: 276px; height: calc(100vh - 60px); overflow-y: auto;
        padding: 26px 18px 40px 22px; border-right: 1px solid var(--border-soft);
        scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    }
    .sidebar h4 {
        margin: 22px 0 8px; font-size: 11px; font-weight: 700; letter-spacing: .1em;
        text-transform: uppercase; color: var(--faint);
    }
    .sidebar h4:first-child { margin-top: 0; }
    .sidebar a.side-link {
        display: flex; align-items: center; gap: 8px;
        padding: 5px 10px; margin: 1px 0; border-radius: 7px;
        color: var(--muted); font-size: 13px; border: 1px solid transparent;
    }
    .sidebar a.side-link:hover { color: var(--text); background: var(--panel); text-decoration: none; }
    .sidebar a.side-link.active { color: var(--text); background: var(--panel-2); border-color: var(--border); }
    .side-method {
        flex: none; width: 42px; font: 700 9.5px/1.5 var(--mono); letter-spacing: .04em;
        text-align: center; padding: 2px 0; border-radius: 4px;
    }
    .side-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--mono); font-size: 11.5px; }

    .content { flex: 1; min-width: 0; padding: 40px 44px 110px; max-width: 1000px; }
    @media (max-width: 900px) {
        .sidebar {
            position: fixed; left: 0; top: 60px; z-index: 35; background: var(--bg-soft);
            transform: translateX(-105%); transition: transform .25s ease; box-shadow: 24px 0 60px rgba(0,0,0,.5);
        }
        body.nav-open .sidebar { transform: none; }
        .content { padding: 28px 18px 90px; }
        .nav-toggle { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 8px;
            border: 1px solid var(--border); background: var(--panel); color: var(--text); cursor: pointer; font-size: 15px; }
        .brand-sub { display: none; }
    }

    /* ---------- Hero ---------- */
    .hero { margin-bottom: 42px; }
    .hero .kicker {
        display: inline-flex; align-items: center; gap: 7px; margin-bottom: 14px;
        font-size: 12px; font-weight: 600; color: var(--accent-2);
        background: rgba(167, 139, 250, .09); border: 1px solid rgba(167, 139, 250, .3);
        padding: 4px 12px; border-radius: 999px;
    }
    .hero h1 { margin: 0 0 10px; font-size: 32px; line-height: 1.2; letter-spacing: -.02em; }
    .hero p { margin: 0 0 20px; color: var(--muted); max-width: 680px; }
    .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
    .stat {
        display: flex; flex-direction: column; gap: 1px; min-width: 108px;
        padding: 10px 16px; border-radius: 10px; background: var(--panel); border: 1px solid var(--border);
    }
    .stat b { font-size: 18px; letter-spacing: -.01em; }
    .stat span { font-size: 11.5px; color: var(--faint); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }

    /* ---------- Cards / sections ---------- */
    section { margin: 0 0 46px; }
    .section-title { display: flex; align-items: center; gap: 10px; margin: 0 0 6px; font-size: 21px; letter-spacing: -.01em; }
    .section-title .count {
        font-size: 11.5px; font-weight: 700; color: var(--faint);
        background: var(--panel); border: 1px solid var(--border); border-radius: 999px; padding: 2px 9px;
    }
    .section-desc { margin: 0 0 18px; color: var(--muted); font-size: 14px; }
    .card {
        background: var(--panel); border: 1px solid var(--border);
        border-radius: 12px; padding: 20px 22px; margin-bottom: 14px;
    }
    .card h3 { margin: 0 0 10px; font-size: 15px; }
    .card p { margin: 8px 0; color: var(--muted); font-size: 14px; }
    .card p code, li code, td code, .inline-code {
        background: var(--panel-2); border: 1px solid var(--border); border-radius: 5px;
        padding: 1.5px 6px; font-size: 12.5px; color: #b7c4ff;
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 760px) { .grid-2 { grid-template-columns: 1fr; } }

    /* ---------- Code blocks ---------- */
    .code { position: relative; margin: 10px 0 0; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-soft); overflow: hidden; }
    .code-head {
        display: flex; align-items: center; gap: 8px; padding: 7px 12px;
        border-bottom: 1px solid var(--border-soft); background: rgba(255,255,255,.015);
        font-size: 11.5px; color: var(--faint); font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
    }
    .code pre {
        margin: 0; padding: 14px 16px; overflow-x: auto;
        font: 12.5px/1.7 var(--mono); color: #c8d3ee; tab-size: 2;
    }
    .copy-btn {
        margin-left: auto; cursor: pointer; border: 1px solid var(--border); background: var(--panel);
        color: var(--muted); font: 600 11px/1 ui-sans-serif, system-ui; border-radius: 6px; padding: 4px 9px;
    }
    .copy-btn:hover { color: var(--text); border-color: var(--accent); }

    /* ---------- Tables ---------- */
    .tbl-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
        text-align: left; padding: 9px 14px; font-size: 11px; letter-spacing: .07em; text-transform: uppercase;
        color: var(--faint); background: rgba(255,255,255,.02); border-bottom: 1px solid var(--border);
    }
    td { padding: 9px 14px; border-bottom: 1px solid var(--border-soft); color: var(--muted); vertical-align: top; }
    tr:last-child td { border-bottom: 0; }
    td:first-child { color: var(--text); font-family: var(--mono); font-size: 12px; white-space: nowrap; }
    .req { color: var(--delete); font-weight: 700; }

    /* ---------- Endpoint cards ---------- */
    .endpoint {
        background: var(--panel); border: 1px solid var(--border);
        border-radius: 12px; margin-bottom: 16px; overflow: hidden;
    }
    .endpoint-head { display: flex; align-items: center; gap: 10px; padding: 13px 18px; border-bottom: 1px solid var(--border-soft); flex-wrap: wrap; }
    .method {
        flex: none; font: 800 11px/1 var(--mono); letter-spacing: .05em;
        padding: 6px 10px; border-radius: 6px; color: #06121f;
    }
    .m-get { background: var(--get); } .m-post { background: var(--post); }
    .m-put { background: var(--put); } .m-patch { background: var(--patch); } .m-delete { background: var(--delete); }
    .ep-path { font: 600 13.5px/1.4 var(--mono); color: var(--text); word-break: break-all; }
    .ep-path .seg-param { color: var(--accent-2); }
    .access {
        margin-left: auto; flex: none; display: inline-flex; align-items: center; gap: 5px;
        font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px;
    }
    .access.public { color: var(--get); background: rgba(52, 211, 153, .1); border: 1px solid rgba(52, 211, 153, .3); }
    .access.bearer { color: var(--accent); background: rgba(109, 139, 255, .1); border: 1px solid rgba(109, 139, 255, .3); }
    .endpoint-body { padding: 16px 18px 18px; }
    .ep-summary { margin: 0 0 4px; font-size: 15px; font-weight: 650; }
    .ep-desc { margin: 0 0 4px; color: var(--muted); font-size: 13.5px; }
    .ep-block-title {
        margin: 18px 0 2px; font-size: 11px; font-weight: 700; letter-spacing: .08em;
        text-transform: uppercase; color: var(--faint);
    }
    .resp-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 7px; }
    .dot-ok { background: var(--get); } .dot-err { background: var(--delete); }

    footer.docs-footer {
        margin-top: 60px; padding-top: 22px; border-top: 1px solid var(--border-soft);
        color: var(--faint); font-size: 12.5px; display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
    }

    /* ---------- Interactive (Scalar) mode ---------- */
    #app { display: none; min-height: 100vh; }
    body.scalar-active #app { display: block; }
    body.scalar-active .site-header,
    body.scalar-active .sidebar,
    body.scalar-active #docs-static { display: none; }
    body.scalar-active { background: #020617; }

    /* ---------- Loading overlay ---------- */
    .docs-loading {
        position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 18px;
        background: radial-gradient(circle at 50% 0%, #0f172a 0%, #070b16 65%);
        transition: opacity .35s ease;
    }
    .docs-loading.hidden { opacity: 0; pointer-events: none; }
    .docs-loading .spinner {
        width: 42px; height: 42px; border-radius: 50%;
        border: 3px solid #1e293b; border-top-color: var(--accent); animation: spin .8s linear infinite;
    }
    .docs-loading p { margin: 0; color: var(--muted); font-size: 13.5px; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<header class="site-header">
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation">☰</button>
    <div class="brand">
        <div class="brand-mark">API</div>
        <span class="brand-title">Sistem Penggajian Guru</span>
        <span class="brand-sub">REST API Documentation</span>
    </div>
    <div class="header-actions">
        <span class="pill version">v{{ $stats['version'] }}</span>
        <a class="header-link" href="{{ $specUrl }}" target="_blank" rel="noopener">&#123; &#125; OpenAPI JSON</a>
        <a class="header-link" href="{{ $baseUrl }}" target="_blank" rel="noopener">Base URL</a>
    </div>
</header>

@php
    use Illuminate\Support\Str;

    // Inline markdown: `code` → <code>, **bold** → <strong> (input is escaped first).
    $md = function (string $text): string {
        $escaped = e($text);
        $escaped = preg_replace('/`([^`]+)`/', '<code>$1</code>', $escaped);
        $escaped = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $escaped);

        return $escaped;
    };

    $pathHtml = function (string $path): string {
        return preg_replace('/\{([^}]+)\}/', '<span class="seg-param">{$1}</span>', e($path));
    };
@endphp

<div class="shell">
    <aside class="sidebar" id="sidebar">
        <h4>Overview</h4>
        <a class="side-link" href="#overview">Introduction</a>
        <a class="side-link" href="#quickstart">Quick start</a>
        <a class="side-link" href="#authentication">Authentication</a>
        <a class="side-link" href="#conventions">Conventions &amp; limits</a>

        <h4>Endpoints</h4>
        @foreach ($groups as $tag => $group)
            <a class="side-link" href="#tag-{{ Str::slug($tag) }}">{{ $tag }}</a>
            @foreach ($group['operations'] as $op)
                <a class="side-link" href="#{{ Str::slug($op['method'].' '.$op['path']) }}" style="padding-left: 16px">
                    <span class="side-method m-{{ strtolower($op['method']) }}">{{ $op['method'] }}</span>
                    <span class="side-path">{{ $op['path'] }}</span>
                </a>
            @endforeach
        @endforeach
    </aside>

    <main class="content" id="docs-static">

        {{-- ================= HERO ================= --}}
        <div class="hero" id="overview">
            <span class="kicker">● OpenAPI 3.1 · Interactive</span>
            <h1>Sistem Penggajian Guru — REST API</h1>
            <p>
                Versioned JSON REST API for the teacher payroll &amp; teaching management platform.
                Public catalogue endpoints need no token; every write operation and all
                identity-dependent data is protected by Sanctum bearer tokens.
            </p>
            <div class="stats">
                <div class="stat"><b>{{ $stats['endpoints'] }}</b><span>Endpoints</span></div>
                <div class="stat"><b>{{ $stats['schemas'] }}</b><span>Schemas</span></div>
                <div class="stat"><b>{{ count($groups) }}</b><span>Tags</span></div>
                <div class="stat"><b>{{ $stats['version'] }}</b><span>Version</span></div>
            </div>
            <div class="code">
                <div class="code-head">Base URL <button class="copy-btn" type="button">Copy</button></div>
                <pre>{{ $baseUrl }}</pre>
            </div>
        </div>

        {{-- ================= QUICK START ================= --}}
        <section id="quickstart">
            <h2 class="section-title">Quick start</h2>
            <p class="section-desc">Three steps from zero to your first authenticated request.</p>

            <div class="card">
                <h3>1 &nbsp;Authenticate</h3>
                <p>Exchange your credentials for a bearer token. Rate limited to <strong>5 attempts / minute</strong> per email + IP.</p>
                <div class="code">
                    <div class="code-head">HTTP · POST /auth/login <button class="copy-btn" type="button">Copy</button></div>
                    <pre>curl -X POST {{ $baseUrl }}/auth/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@siguru.com", "password": "your-password"}'</pre>
                </div>
            </div>

            <div class="card">
                <h3>2 &nbsp;Call protected endpoints</h3>
                <p>Send the token on every request as <code>Authorization: Bearer {token}</code>.</p>
                <div class="code">
                    <div class="code-head">HTTP · GET /dashboard <button class="copy-btn" type="button">Copy</button></div>
                    <pre>curl {{ $baseUrl }}/dashboard \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz"</pre>
                </div>
            </div>

            <div class="card">
                <h3>3 &nbsp;Revoke the token</h3>
                <p>The token is invalid immediately after this call.</p>
                <div class="code">
                    <div class="code-head">HTTP · POST /auth/logout <button class="copy-btn" type="button">Copy</button></div>
                    <pre>curl -X POST {{ $baseUrl }}/auth/logout \
  -H "Authorization: Bearer 1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz"</pre>
                </div>
            </div>
        </section>

        {{-- ================= AUTHENTICATION ================= --}}
        <section id="authentication">
            <h2 class="section-title">Authentication</h2>
            <p class="section-desc">
                The API uses <strong>Sanctum personal access tokens</strong>. Tokens do not expire by default —
                keep them secret and revoke them via <code>POST /auth/logout</code>.
            </p>

            <div class="tbl-wrap">
                <table>
                    <thead><tr><th>Operation</th><th>Authentication</th></tr></thead>
                    <tbody>
                        <tr><td>GET (catalogue)</td><td>Public — grades, transports, locations, teachers, teaching sessions, teaching material metadata.</td></tr>
                        <tr><td>GET (identity / sensitive)</td><td>Bearer token — dashboard, schedules, profile, notifications, <code>mine</code> endpoints, attendance recap, salaries, payroll, reports, exports.</td></tr>
                        <tr><td>POST / PUT / PATCH / DELETE</td><td>Bearer token <em>always</em>, plus the <code>admin</code> or <code>guru</code> role as documented per endpoint.</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="code">
                <div class="code-head">Login response <button class="copy-btn" type="button">Copy</button></div>
                <pre>{
  "success": true,
  "message": "Authenticated successfully.",
  "data": {
    "token": "1|XaBcD1234EfGhIjKlMnOpQrStUvWxYz",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "Admin", "email": "admin@siguru.com", "role": "admin" }
  }
}</pre>
            </div>
        </section>

        {{-- ================= CONVENTIONS ================= --}}
        <section id="conventions">
            <h2 class="section-title">Conventions &amp; limits</h2>

            <div class="grid-2">
                <div class="card">
                    <h3>Success envelope</h3>
                    <div class="code">
                        <div class="code-head">JSON <button class="copy-btn" type="button">Copy</button></div>
                        <pre>{
  "success": true,
  "message": "Request completed successfully.",
  "data": { }
}</pre>
                    </div>
                </div>
                <div class="card">
                    <h3>Paginated collection</h3>
                    <div class="code">
                        <div class="code-head">JSON <button class="copy-btn" type="button">Copy</button></div>
                        <pre>{
  "success": true,
  "message": "Request completed successfully.",
  "data": [ ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 42,
    "last_page": 3
  }
}</pre>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Error envelope</h3>
                <div class="code">
                    <div class="code-head">JSON <button class="copy-btn" type="button">Copy</button></div>
                    <pre>{
  "success": false,
  "message": "The given data was invalid.",
  "errors": { "email": ["The provided credentials are incorrect."] }
}</pre>
                </div>
            </div>

            <div class="tbl-wrap">
                <table>
                    <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
                    <tbody>
                        <tr><td>200</td><td>OK — success, including updates and deletes (<code>data: null</code> for deletes).</td></tr>
                        <tr><td>201</td><td>Created — a new resource was created.</td></tr>
                        <tr><td>401</td><td>Unauthenticated — missing, invalid, or revoked token.</td></tr>
                        <tr><td>403</td><td>Forbidden — valid token but insufficient role, or ownership violation.</td></tr>
                        <tr><td>404</td><td>Not Found — the resource does not exist.</td></tr>
                        <tr><td>409</td><td>Conflict — the request conflicts with current state (e.g. deleting data still in use).</td></tr>
                        <tr><td>422</td><td>Validation error — see the <code>errors</code> object.</td></tr>
                        <tr><td>429</td><td>Too many requests — slow down and retry later.</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="tbl-wrap">
                <table>
                    <thead><tr><th>Rate limit</th><th>Applies to</th></tr></thead>
                    <tbody>
                        <tr><td>60 / min</td><td>General API — per user (or per IP for guests).</td></tr>
                        <tr><td>5 / min</td><td><code>POST /auth/login</code> — per email + IP.</td></tr>
                        <tr><td>10 / min</td><td><code>POST /attendances/check-in</code> &amp; <code>POST /attendances/check-out</code>.</td></tr>
                        <tr><td>1 / min</td><td><code>POST /salaries/calculate</code>.</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h3>Data conventions</h3>
                <ul style="margin: 6px 0 0; padding-left: 20px; color: var(--muted); font-size: 14px;">
                    <li>Timestamps are ISO 8601 (<code>2026-01-15T08:00:00+07:00</code>); dates use <code>YYYY-MM-DD</code>, periods <code>YYYY-MM</code>, times 24h <code>HH:mm</code>.</li>
                    <li>Money values are plain numbers in IDR (e.g. <code>60000</code> = Rp 60.000).</li>
                    <li>Send <code>Accept: application/json</code> on every request to receive JSON errors.</li>
                    <li>Paginated endpoints accept <code>page</code> and <code>per_page</code> (default 15, max 100).</li>
                </ul>
            </div>
        </section>

        {{-- ================= ENDPOINTS ================= --}}
        @foreach ($groups as $tag => $group)
            <section id="tag-{{ Str::slug($tag) }}">
                <h2 class="section-title">{{ $tag }} <span class="count">{{ count($group['operations']) }} endpoints</span></h2>
                @if ($group['description'])
                    <p class="section-desc">{{ $group['description'] }}</p>
                @endif

                @foreach ($group['operations'] as $op)
                    <div class="endpoint" id="{{ Str::slug($op['method'].' '.$op['path']) }}">
                        <div class="endpoint-head">
                            <span class="method m-{{ strtolower($op['method']) }}">{{ $op['method'] }}</span>
                            <span class="ep-path">{!! $pathHtml($op['path']) !!}</span>
                            <span class="access {{ $op['isPublic'] ? 'public' : 'bearer' }}">
                                {{ $op['isPublic'] ? '🌐 Public' : '🔒 Bearer token' }}
                            </span>
                        </div>
                        <div class="endpoint-body">
                            <p class="ep-summary">{{ $op['summary'] }}</p>
                            @if ($op['description'])
                                <p class="ep-desc">{!! $md($op['description']) !!}</p>
                            @endif

                            @if (count($op['parameters']))
                                <div class="ep-block-title">Parameters</div>
                                <div class="tbl-wrap">
                                    <table>
                                        <thead><tr><th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                                        <tbody>
                                            @foreach ($op['parameters'] as $param)
                                                <tr>
                                                    <td>{{ $param['name'] ?? '—' }}</td>
                                                    <td>{{ $param['in'] ?? '—' }}</td>
                                                    <td><code>{{ $param['schema']['type'] ?? 'string' }}{{ isset($param['schema']['enum']) ? ' ('.implode('|', $param['schema']['enum']).')' : '' }}</code></td>
                                                    <td>{!! ($param['required'] ?? false) ? '<span class="req">yes</span>' : 'no' !!}</td>
                                                    <td>{!! $md($param['description'] ?? '') !!}</td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            @endif

                            @if ($op['requestExample'])
                                <div class="ep-block-title">Request body</div>
                                <div class="code">
                                    <div class="code-head">application/json <button class="copy-btn" type="button">Copy</button></div>
                                    <pre>{{ $op['requestExample'] }}</pre>
                                </div>
                            @endif

                            <div class="ep-block-title">Responses</div>
                            <div class="tbl-wrap">
                                <table>
                                    <tbody>
                                        @foreach ($op['responses'] as $row)
                                            <tr>
                                                <td><span class="resp-dot {{ $row['isSuccess'] ? 'dot-ok' : 'dot-err' }}"></span>{{ $row['status'] }}</td>
                                                <td>{!! $md($row['description']) !!}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>

                            @if ($op['responseExample'])
                                <div class="ep-block-title">Example response</div>
                                <div class="code">
                                    <div class="code-head">application/json <button class="copy-btn" type="button">Copy</button></div>
                                    <pre>{{ $op['responseExample'] }}</pre>
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </section>
        @endforeach

        <footer class="docs-footer">
            <span>Generated from the OpenAPI 3.1 document.</span>
            <a href="{{ $specUrl }}" target="_blank" rel="noopener">openapi.json</a>
            <a href="https://github.com/ZalStack/sistem-penggajian-guru" target="_blank" rel="noopener">Source</a>
        </footer>
    </main>
</div>

<div id="app"></div>

<div class="docs-loading" id="docs-loading">
    <div class="spinner"></div>
    <p>Loading interactive documentation…</p>
</div>

<script>
    window.__docsReady = false;

    function hideLoader() {
        var loader = document.getElementById('docs-loading');
        if (loader) { loader.classList.add('hidden'); }
    }

    function mountScalar() {
        // The standalone bundle exposes window.Scalar.createApiReference.
        var createApiReference = (window.Scalar && window.Scalar.createApiReference) || window.createApiReference;
        if (typeof createApiReference !== 'function') { return false; }

        createApiReference('#app', {
            url: @js($specUrl),
            theme: 'keel',
            hideDarkMode: false,
            hideClientButton: false,
            showSearchButton: true,
            downloadButton: true,
            authentication: {
                preferredSecurityScheme: 'bearerAuth',
                http: { bearer: { token: '' } },
            },
            metaData: { title: 'Sistem Penggajian Guru — REST API' },
        });

        window.__docsReady = true;
        document.body.classList.add('scalar-active');
        window.scrollTo(0, 0);
        setTimeout(hideLoader, 450);

        return true;
    }

    function loadScript(src, onLoad, onError) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = onLoad;
        script.onerror = onError;
        document.body.appendChild(script);
    }

    // 1) self-hosted bundle  2) CDN bundle  3) server-rendered static reference
    loadScript(@js($localBundleUrl), function () {
        if (!mountScalar()) { loadScript(@js($cdnBundleUrl), mountScalar, hideLoader); }
    }, function () {
        loadScript(@js($cdnBundleUrl), function () {
            if (!mountScalar()) { hideLoader(); }
        }, hideLoader);
    });

    // Safety net: never trap the user behind the loader.
    setTimeout(function () { if (!window.__docsReady) { hideLoader(); } }, 12000);

    // Copy buttons
    document.addEventListener('click', function (event) {
        var button = event.target.closest('.copy-btn');
        if (!button) { return; }
        var pre = button.closest('.code').querySelector('pre');
        navigator.clipboard.writeText(pre.innerText).then(function () {
            var original = button.textContent;
            button.textContent = 'Copied ✓';
            setTimeout(function () { button.textContent = original; }, 1400);
        });
    });

    // Mobile navigation
    var navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            document.body.classList.toggle('nav-open');
        });
        document.getElementById('sidebar').addEventListener('click', function (event) {
            if (event.target.closest('a')) { document.body.classList.remove('nav-open'); }
        });
    }

    // Scroll-spy: highlight the active sidebar entry
    var spyTargets = document.querySelectorAll('section[id], .endpoint[id], .hero[id]');
    var spyLinks = {};
    document.querySelectorAll('.sidebar a.side-link').forEach(function (link) {
        spyLinks[link.getAttribute('href').slice(1)] = link;
    });

    var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) { return; }
            document.querySelectorAll('.sidebar a.side-link.active').forEach(function (el) { el.classList.remove('active'); });
            var link = spyLinks[entry.target.id];
            if (link) {
                link.classList.add('active');
                var sidebar = document.getElementById('sidebar');
                var top = link.offsetTop - sidebar.clientHeight / 2;
                sidebar.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });

    spyTargets.forEach(function (target) { spy.observe(target); });
</script>
</body>
</html>
