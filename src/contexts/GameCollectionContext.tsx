import { createContext, useContext, ReactNode } from "react";
import type { Game } from "@/types/game";

interface GameCollectionContextValue {
  games: Game[];
  getGame: (id: string) => Game | undefined;
}

const GameCollectionContext = createContext<GameCollectionContextValue | undefined>(undefined);

interface GameCollectionProviderProps {
  games: Game[];
  children: ReactNode;
}

export function GameCollectionProvider({ games, children }: GameCollectionProviderProps) {
  const getGame = (id: string) => games.find((g) => g.id === id);

  return (
    <GameCollectionContext.Provider value={{ games, getGame }}>
      {children}
    </GameCollectionContext.Provider>
  );
}

export function useGameCollection() {
  const context = useContext(GameCollectionContext);
  // Return undefined if context doesn't exist (e.g., when navigating directly to GameDetail)
  return context;
}
