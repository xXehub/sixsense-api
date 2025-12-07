export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo/Title */}
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-lime-400">six</span>
            <span className="text-white">sense</span>
          </h1>
          <p className="text-gray-400 text-xl mb-8">
            Key System API
          </p>

          {/* Status Card */}
          <div className="max-w-md mx-auto bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">Online</span>
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Version</span>
                <span className="text-white">2.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">API Status</span>
                <span className="text-green-400">Operational</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 flex justify-center gap-4">
            <a 
              href="/api/stats" 
              className="px-4 py-2 bg-lime-600 hover:bg-cyan-700 rounded-lg transition-colors"
            >
              View Stats
            </a>
            <a 
              href="https://discord.gg/sixsense" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Discord
            </a>
          </div>

          {/* API Docs Preview */}
          <div className="mt-16 max-w-2xl mx-auto text-left">
            <h2 className="text-2xl font-bold mb-4 text-lime-800">API Endpoints</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-600 text-xs rounded">POST</span>
                  <code className="text-gray-300">/api/validate</code>
                </div>
                <p className="text-gray-400 text-sm">Validate key and get script token</p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-600 text-xs rounded">POST</span>
                  <code className="text-gray-300">/api/script</code>
                </div>
                <p className="text-gray-400 text-sm">Get script content with valid token</p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-600 text-xs rounded">GET</span>
                  <code className="text-gray-300">/api/stats</code>
                </div>
                <p className="text-gray-400 text-sm">Get public statistics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 sixsense. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
