'use client'

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="px-6 py-4 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Home
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Docs
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Guides
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Academy
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Help
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Contact
          </a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Legal
          </a>
        </nav>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>All systems normal</span>
        </div>
      </div>
    </footer>
  )
}