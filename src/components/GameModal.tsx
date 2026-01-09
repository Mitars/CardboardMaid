import { Game } from "@/types/game";
import { X, Dice6, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onPickAnother: () => void;
  bggUsername: string;
}

export function GameModal({ game, isOpen, onClose, onPickAnother, bggUsername }: GameModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !game) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <h2 className="text-2xl font-bold font-display text-foreground">
            How about this game?
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Details */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col sm:flex-row gap-6 h-full">
            {/* Game Image */}
            <div className="flex-shrink-0 mx-auto sm:mx-0 overflow-hidden rounded-xl shadow-lg max-h-[45vh]">
              <img
                src={game.image}
                alt={game.name}
                className="w-full sm:w-auto sm:max-w-xs h-auto object-contain"
              />
            </div>

            {/* Game Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">{game.name}</h3>
                <p className="text-sm text-muted-foreground">{game.yearPublished}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Players</p>
                  <p className="font-semibold text-foreground">
                    {game.players.min} - {game.players.max}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Playtime</p>
                  <p className="font-semibold text-foreground">
                    {game.playtime.min} - {game.playtime.max} min
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">BGG Rating</p>
                  <p className="font-semibold text-foreground">
                    {game.rating.average.toFixed(1)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Your Rating</p>
                  <p className="font-semibold text-foreground">
                    {game.userRating ? game.userRating.toFixed(1) : "Not rated"}
                  </p>
                </div>
              </div>

              {/* Categories */}
              {game.categories && game.categories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.slice(0, 4).map((category) => (
                      <span
                        key={category}
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {game.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground line-clamp-6">
                    {game.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              navigate(`/game/${game.id}`);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Details
          </button>
          <button
            onClick={onPickAnother}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
          >
            <Dice6 className="w-4 h-4" />
            Choose Another
          </button>
        </div>
      </div>
    </div>
  );
}
