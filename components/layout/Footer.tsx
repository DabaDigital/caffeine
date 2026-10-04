import Image from "next/image";
import { Coffee, Heart, Instagram, ArrowUpRight } from "lucide-react";
import { assets, navigation, social } from "@/data/brand";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <a href="#home" aria-label="Caffeine home">
            <Image
              src={assets.logo}
              alt="Caffeine Coffee & Tea House"
              width={100}
              height={100}
              sizes="100px"
            />
          </a>
          <nav aria-label="Footer navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram <ArrowUpRight size={14} />
            </a>
          </nav>
          <p className="footer-signoff">
            Good coffee,<span className="script">Sweet moments.</span>
          </p>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Caffeine. All rights reserved.
          </span>
          <span className="footer-made">
            <Coffee size={14} /> Coffee & Tea House <Heart size={13} />
          </span>
          <a
            href={social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Caffeine on Instagram"
          >
            <Instagram size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
