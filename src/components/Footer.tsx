import { KoFiDialog } from "react-kofi";
import "react-kofi/dist/styles.css";

export const Footer = () => {
  return (
    <footer className="w-full px-4 py-6 mt-auto">
      <div className="border-t border-border mb-4" />
      <div className="flex justify-center items-center gap-8 text-xs">
        <a
          href="https://github.com/mitars/cardboardMaid"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          GitHub
        </a>
        <KoFiDialog
          color="#f042b6"
          textColor="#000"
          id="mitar"
          label="Support me"
          padding={0}
          width={400}
          iframe={false}
          buttonRadius="6px"
        />
        <a
          href="https://boardgamegeek.com/support"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Support BGG
        </a>
      </div>
    </footer>
  );
};
