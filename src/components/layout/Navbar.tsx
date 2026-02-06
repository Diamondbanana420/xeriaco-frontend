import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { items } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-lg font-extralight tracking-[0.4em] text-foreground/90 hover:text-foreground transition-colors duration-500">
            XERIACO
          </Link>

          {/* Center Nav Links - Hidden on mobile */}
          <div className="hidden items-center gap-12 md:flex">
            <Link to="/shop" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors duration-500">
              Shop
            </Link>
            <Link to="/about" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors duration-500">
              About
            </Link>
            <Link to="/contact" className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground transition-colors duration-500">
              Contact
            </Link>
          </div>

          {/* Right Icons */}
          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 hover:bg-muted/30">
                <Link to="/account">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 hover:bg-muted/30">
                <Link to="/auth">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 hover:bg-muted/30 relative">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">{items.length}</span>
                )}
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" asChild className="rounded-full h-10 w-10 hover:bg-muted/30 relative">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">{items.length}</span>
                )}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-8 md:hidden animate-fade-in">
            <div className="flex flex-col items-center gap-6">
              <Link 
                to="/shop" 
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                to="/about" 
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="w-8 h-px bg-muted/30 my-2" />
              {user ? (
                <>
                  <Link 
                    to="/account" 
                    className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button 
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
