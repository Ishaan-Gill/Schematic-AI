import Link from "next/link";
import { Brand } from "./landing-shared";

export function Footer() {
  return (
    <footer className="footer">
      <Brand />
      <p>
        Business answers that remain
        <br />
        connected to the work behind them.
      </p>
      <div className="footer__links">
        <Link href="/#method">Method</Link>
        <Link href="/#proof">Trust</Link>
        <Link href="/#questions">FAQ</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:getschematicai@gmail.com">Contact</a>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Schematic AI</span>
        <span>Built for curious operators.</span>
      </div>
    </footer>
  );
}
