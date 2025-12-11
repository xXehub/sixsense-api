/**
 * Reusable Access Denied HTML Generator
 * Uses SixSense global theme (Skeet/Gamesense Green)
 */

interface AccessDeniedOptions {
  title?: string;
  message?: string;
  subtitle?: string;
  icon?: string;
  showHomeButton?: boolean;
  baseUrl?: string;
}

export function generateAccessDeniedHTML(options: AccessDeniedOptions = {}): string {
  const {
    title = 'Access Denied',
    message = 'This endpoint is protected and can only be accessed via Roblox Executor',
    subtitle = 'If you\'re a developer, use the proper loadstring method to access protected scripts.',
    icon = '🛡️',
    showHomeButton = true,
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev'
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} | SixSense</title>
  <style>
    :root {
      --primary: #4ade80;
      --primary-hover: #22c55e;
      --primary-glow: rgba(74, 222, 128, 0.15);
      --accent: #86efac;
      --background: #0a0a0a;
      --background-card: #141414;
      --border: #262626;
      --text: #ffffff;
      --text-secondary: #a3a3a3;
      --text-muted: #737373;
      --error: #ef4444;
      --error-glow: rgba(239, 68, 68, 0.15);
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--text);
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Background Effects */
    .bg-effects {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(128px);
    }
    
    .orb-1 {
      top: 20%;
      left: 20%;
      width: 300px;
      height: 300px;
      background: var(--primary);
      opacity: 0.08;
    }
    
    .orb-2 {
      bottom: 20%;
      right: 20%;
      width: 300px;
      height: 300px;
      background: var(--error);
      opacity: 0.06;
    }
    
    .grid-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.02;
      background-image: 
        linear-gradient(var(--border) 1px, transparent 1px),
        linear-gradient(90deg, var(--border) 1px, transparent 1px);
      background-size: 64px 64px;
    }
    
    /* Card */
    .container {
      position: relative;
      z-index: 1;
      text-align: center;
      padding: 3rem;
      background: var(--background-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 420px;
      animation: fadeIn 0.4s ease-out;
    }
    
    @keyframes fadeIn {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.98); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
    
    /* Icon */
    .icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      background: var(--error-glow);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    
    /* Typography */
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--text);
    }
    
    .message {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
    
    .subtitle {
      color: var(--text-muted);
      font-size: 0.85rem;
      line-height: 1.5;
    }
    
    .code {
      display: inline-block;
      background: var(--primary-glow);
      color: var(--primary);
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 0.85rem;
      border: 1px solid rgba(74, 222, 128, 0.2);
    }
    
    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    
    .btn:hover {
      background: var(--primary-glow);
      border-color: var(--primary);
      color: var(--primary);
    }
    
    /* Footer */
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    
    .footer p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    
    .footer strong {
      color: var(--primary);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="bg-effects">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="grid-pattern"></div>
  </div>
  
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    <p class="subtitle">${subtitle}</p>
    ${showHomeButton ? `<a href="${baseUrl}" class="btn">← Back to Home</a>` : ''}
    <div class="footer">
      <p>🔒 Protected by <strong>SixSense</strong></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate Lua access denied script (for executors that somehow bypass UA check)
 */
export function generateAccessDeniedLua(message: string = 'Access denied'): string {
  return `-- SixSense Protection\nreturn warn("[SixSense] ${message}")`;
}
