// vite-plugin-morgan.js
// Place: project root  →  vite-plugin-morgan.js
// Logs every proxied /api request in your terminal, matching your backend style.

const c = {
  reset:     '\x1b[0m',
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  red:       '\x1b[31m',
  green:     '\x1b[32m',
  yellow:    '\x1b[33m',
  blue:      '\x1b[34m',
  magenta:   '\x1b[35m',
  cyan:      '\x1b[36m',
  white:     '\x1b[37m',
  gray:      '\x1b[90m',
  bRed:      '\x1b[91m',
  bGreen:    '\x1b[92m',
  bYellow:   '\x1b[93m',
  bBlue:     '\x1b[94m',
  bMagenta:  '\x1b[95m',
  bCyan:     '\x1b[96m',
  bWhite:    '\x1b[97m',
  bgRed:     '\x1b[41m',
  bgGreen:   '\x1b[42m',
  bgYellow:  '\x1b[43m',
  bgBlue:    '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
};

// ── helpers — identical logic to your backend ────────────────────────────────

const statusColor = (status) => {
  if (!status)       return `${c.bold}${c.gray} ??? ${c.reset}`;
  if (status >= 500) return `${c.bold}${c.bgRed}${c.white} ${status} ${c.reset}`;
  if (status >= 400) return `${c.bold}${c.bgYellow}${c.white} ${status} ${c.reset}`;
  if (status >= 300) return `${c.bold}${c.bgCyan}${c.white} ${status} ${c.reset}`;
  if (status >= 200) return `${c.bold}${c.bgGreen}${c.white} ${status} ${c.reset}`;
  return `${c.bold}${c.gray} ${status} ${c.reset}`;
};

const methodColor = (method = 'GET') => {
  const map = {
    GET:    `${c.bold}${c.bGreen}`,
    POST:   `${c.bold}${c.bBlue}`,
    PUT:    `${c.bold}${c.bYellow}`,
    PATCH:  `${c.bold}${c.bMagenta}`,
    DELETE: `${c.bold}${c.bRed}`,
  };
  const col = map[method.toUpperCase()] || `${c.bold}${c.gray}`;
  return `${col}${method.toUpperCase().padEnd(6)}${c.reset}`;
};

const timeColor = (ms) => {
  if (ms > 500) return `${c.bRed}${ms}ms${c.reset}`;
  if (ms > 200) return `${c.bYellow}${ms}ms${c.reset}`;
  return `${c.bGreen}${ms}ms${c.reset}`;
};

const routeBadge = (url = '') => {
  if (url.startsWith('/api/interviews'))  return `${c.bgMagenta}${c.white}${c.bold} INTERVIEWS ${c.reset}`;
  if (url.startsWith('/api/questions'))   return `${c.bgCyan}${c.white}${c.bold} QUESTIONS  ${c.reset}`;
  if (url.startsWith('/api/users'))       return `${c.bgBlue}${c.white}${c.bold} USERS      ${c.reset}`;
  if (url.startsWith('/api/analytics'))   return `${c.bgYellow}${c.white}${c.bold} ANALYTICS  ${c.reset}`;
  if (url.startsWith('/api/preparation')) return `${c.bgGreen}${c.white}${c.bold} PREP       ${c.reset}`;
  if (url.startsWith('/api/assessments')) return `${c.bgRed}${c.white}${c.bold} ASSESS     ${c.reset}`;
  if (url.startsWith('/api/syllabus'))    return `${c.bgMagenta}${c.white}${c.bold} SYLLABUS   ${c.reset}`;
  if (url.startsWith('/api/feedback'))    return `${c.bgCyan}${c.white}${c.bold} FEEDBACK   ${c.reset}`;
  if (url.startsWith('/api/help-chat'))   return `${c.bgBlue}${c.white}${c.bold} HELP-CHAT  ${c.reset}`;
  if (url.startsWith('/api/health'))      return `${c.bgGreen}${c.white}${c.bold} HEALTH     ${c.reset}`;
  return `${c.gray}${c.bold} API        ${c.reset}`;
};

const now = () =>
  new Date().toLocaleTimeString('en-IN', { hour12: false });

// ── plugin ────────────────────────────────────────────────────────────────────

export default function viteMorganPlugin() {
  return {
    name: 'vite-morgan',
    enforce: 'pre',

    // Fires once when the dev server starts
    configureServer(server) {

      // Print a one-time banner so it's clear the logger is active
      const line = `${c.dim}${'─'.repeat(54)}${c.reset}`;
      console.log(`\n  ${line}`);
      console.log(`  ${c.bgMagenta}${c.white}${c.bold} VITE MORGAN ${c.reset}  ${c.bCyan}API request logger active${c.reset}  ${c.dim}→ /api/*${c.reset}`);
      console.log(`  ${line}\n`);

      // Intercept every request that hits the Vite dev server
      server.middlewares.use((req, res, next) => {
        // Only log /api calls (everything else is hot-reload, assets, etc.)
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        const start    = performance.now();
        const method   = req.method || 'GET';
        const url      = req.url;

        // Hook into the response finish event so we have the status code
        const onFinish = () => {
          const ms     = Math.round(performance.now() - start);
          const status = res.statusCode;
          const len    = res.getHeader('content-length') || '-';

          console.log(
            [
              `${c.dim}${now()}${c.reset}`,
              routeBadge(url),
              methodColor(method),
              statusColor(status),
              `${c.bWhite}${url}${c.reset}`,
              `${c.dim}→${c.reset}`,
              timeColor(ms),
              `${c.dim}${len}b${c.reset}`,
            ].join('  ')
          );

          res.removeListener('finish', onFinish);
          res.removeListener('close',  onFinish);
        };

        res.on('finish', onFinish);
        res.on('close',  onFinish);   // catches aborted requests too

        next();
      });
    },
  };
}