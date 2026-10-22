<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>API Documentation — Sistem Penggajian Guru</title>
    <style>
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; background: #020617; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
        #app { min-height: 100%; }

        /* Loading state shown until Scalar mounts */
        .docs-loading {
            position: fixed; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 18px;
            background: radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 60%);
            z-index: 50; transition: opacity .3s ease;
        }
        .docs-loading.hidden { opacity: 0; pointer-events: none; }
        .docs-loading .spinner {
            width: 44px; height: 44px; border-radius: 50%;
            border: 3px solid #1e293b; border-top-color: #6366f1;
            animation: spin .8s linear infinite;
        }
        .docs-loading p { margin: 0; color: #94a3b8; font-size: 14px; letter-spacing: .02em; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Fallback shown when the CDN script cannot be loaded (offline) */
        .docs-fallback { display: none; max-width: 860px; margin: 0 auto; padding: 48px 24px; }
        .docs-fallback.visible { display: block; }
        .docs-fallback h1 { font-size: 26px; margin: 0 0 4px; color: #f8fafc; }
        .docs-fallback .sub { color: #94a3b8; margin: 0 0 28px; font-size: 14px; }
        .docs-fallback .card {
            background: #0f172a; border: 1px solid #1e293b; border-radius: 12px;
            padding: 20px 22px; margin-bottom: 16px;
        }
        .docs-fallback h2 { font-size: 15px; margin: 0 0 12px; color: #c7d2fe; }
        .docs-fallback code {
            background: #020617; border: 1px solid #1e293b; border-radius: 6px;
            padding: 2px 6px; font-size: 12.5px; color: #a5b4fc;
        }
        .docs-fallback pre {
            background: #020617; border: 1px solid #1e293b; border-radius: 8px;
            padding: 14px; overflow-x: auto; font-size: 12.5px; line-height: 1.6; color: #cbd5e1;
        }
        .docs-fallback a { color: #818cf8; }
        .docs-fallback .badge {
            display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 8px;
            border-radius: 999px; background: #1e1b4b; color: #a5b4fc; margin-right: 6px;
        }
    </style>
</head>
<body>
    <div id="app"></div>

    <div class="docs-loading" id="docs-loading">
        <div class="spinner"></div>
        <p>Loading API documentation…</p>
    </div>

    <div class="docs-fallback" id="docs-fallback">
        <h1>Sistem Penggajian Guru — REST API</h1>
        <p class="sub">
            The interactive documentation could not load its UI bundle (no internet connection?).
            The OpenAPI document itself is still available at
            <a href="{{ $specUrl }}">{{ $specUrl }}</a>.
        </p>

        <div class="card">
            <h2>Base URL</h2>
            <p style="margin:0"><code>{{ $appUrl }}/api/{{ $apiVersion }}</code></p>
        </div>

        <div class="card">
            <h2>Authentication</h2>
            <p style="margin:0 0 10px">
                <span class="badge">Public GET</span>Catalogue endpoints (grades, transports, locations,
                teachers, sessions, material metadata) need no token.
                <span class="badge">Bearer token</span>Required for all POST/PUT/PATCH/DELETE and for
                identity-dependent or sensitive GET endpoints.
            </p>
            <pre>POST {{ $appUrl }}/api/v1/auth/login
Content-Type: application/json

{ "email": "admin@siguru.com", "password": "your-password" }</pre>
        </div>

        <div class="card">
            <h2>Response envelope</h2>
            <pre>{
  "success": true,
  "message": "Request completed successfully.",
  "data": { },
  "meta": { "current_page": 1, "per_page": 15, "total": 42, "last_page": 3 }
}</pre>
        </div>
    </div>

    <script>
        window.__docsReady = false;

        function mountScalar() {
            if (typeof window.createApiReference === 'undefined') {
                return false;
            }

            window.createApiReference('#app', {
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
                metaData: {
                    title: 'Sistem Penggajian Guru — REST API',
                },
            });

            window.__docsReady = true;

            setTimeout(function () {
                var loader = document.getElementById('docs-loading');
                if (loader) { loader.classList.add('hidden'); }
            }, 400);

            return true;
        }

        // Fallback: if the CDN bundle never loads, show the static quick-start.
        setTimeout(function () {
            if (!window.__docsReady) {
                var loader = document.getElementById('docs-loading');
                if (loader) { loader.classList.add('hidden'); }
                document.getElementById('docs-fallback').classList.add('visible');
            }
        }, 6000);
    </script>

    {{-- Scalar API Reference (modern, user-friendly OpenAPI UI) --}}
    <script
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.75.1/dist/browser/standalone.js"
        onload="mountScalar()"
        onerror="document.getElementById('docs-loading').classList.add('hidden'); document.getElementById('docs-fallback').classList.add('visible');">
    </script>
</body>
</html>
