import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* Brand & Project Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="font-heading text-black text-lg font-bold">R</span>
              </div>
              <span className="font-heading text-3xl font-bold">ROOM</span>
            </div>
            <p className="font-body text-white/80 mb-6 leading-relaxed">
              An interactive flipdot display experience exploring the intersection of mechanical and digital worlds.
            </p>
            
            {/* Credits */}
            <div className="space-y-2">
              <p className="font-body text-sm text-white/60">
                Created by <span className="text-white font-medium">Group 5</span>
              </p>
              <p className="font-body text-sm text-white/60">
                In collaboration with <span className="text-white font-medium">OWOW x Fontys</span>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-1">
            <h3 className="font-heading text-lg font-bold mb-6">Navigate</h3>
            <nav className="space-y-4">
              <Link
                href="#explore"
                className="block font-body text-white/80 hover:text-white transition-colors text-lg"
              >
                Explore the Room
              </Link>
              <Link
                href="#how-it-works"
                className="block font-body text-white/80 hover:text-white transition-colors text-lg"
              >
                How it Works
              </Link>
              <Link
                href="#about"
                className="block font-body text-white/80 hover:text-white transition-colors text-lg"
              >
                About Flipdots
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            {/* Legal Small Print */}
            <p className="font-body text-xs text-white/50">
              Prototype developed at Fontys University of Applied Sciences
            </p>
            
            {/* Copyright */}
            <p className="font-body text-xs text-white/50">
              © {currentYear} ROOM Project
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
