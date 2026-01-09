import { FilterState, SortOption, SortDirection } from "@/types/game";
import { X, Filter, Shuffle, ArrowUp, ArrowDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

interface FilterHeaderProps {
  username: string;
  filters: FilterState;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onFiltersChange: (filters: FilterState) => void;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionToggle: () => void;
  totalGames: number;
  filteredCount: number;
  availableCategories?: string[];
  onReshuffle?: () => void;
}

const playtimeOptions = [
  { value: "any", label: "any time" },
  { value: "0-30", label: "30 minutes or less" },
  { value: "0-60", label: "1 hour or less" },
  { value: "0-120", label: "2 hours or less" },
  { value: "0-180", label: "3 hours or less" },
  { value: "20-60", label: "20-60 minutes" },
  { value: "60-120", label: "1-2 hours" },
  { value: "120-240", label: "2-4 hours" },
  { value: "240-999", label: "4 or more hours" },
];

const playerOptions = [
  { value: "any", label: "any number of players" },
  { value: "1", label: "1 player" },
  { value: "2", label: "2 players" },
  { value: "3", label: "3 players" },
  { value: "4", label: "4 players" },
  { value: "5", label: "5 players" },
  { value: "6", label: "6 players" },
  { value: "7", label: "7 players" },
  { value: "8", label: "8+ players" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "user-rating", label: "my favorites" },
  { value: "rating", label: "rating" },
  { value: "name", label: "name" },
  { value: "year", label: "release year" },
  { value: "complexity", label: "complexity" },
  { value: "plays", label: "times played" },
  { value: "last-played", label: "last played" },
  { value: "random", label: "random" },
];

export function FilterHeader({
  username,
  filters,
  sortBy,
  sortDirection,
  onFiltersChange,
  onSortChange,
  onSortDirectionToggle,
  totalGames,
  filteredCount,
  availableCategories = [],
  onReshuffle,
}: FilterHeaderProps) {
  const navigate = useNavigate();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Check if current sort is directional (supports asc/desc toggle) - all except random
  const isDirectional = sortBy !== 'random';
  const handlePlayerChange = (value: string) => {
    onFiltersChange({
      ...filters,
      playerCount: value === "any" ? null : parseInt(value),
    });
  };

  const handlePlaytimeChange = (value: string) => {
    if (value === "any") {
      onFiltersChange({
        ...filters,
        minPlaytime: null,
        maxPlaytime: null,
      });
    } else {
      const [min, max] = value.split("-").map(Number);
      onFiltersChange({
        ...filters,
        minPlaytime: min,
        maxPlaytime: max,
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === "_all_categories" ? null : category,
    });
  };

  const getCurrentPlaytimeValue = () => {
    if (filters.minPlaytime === null && filters.maxPlaytime === null) return "any";
    return `${filters.minPlaytime || 0}-${filters.maxPlaytime || 999}`;
  };

  const getCategoryValue = () => {
    return filters.category || "_all_categories";
  };

  const InlineSelect = ({ 
    value, 
    onValueChange, 
    options 
  }: { 
    value: string; 
    onValueChange: (value: string) => void; 
    options: { value: string; label: string }[] 
  }) => (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="inline-flex w-auto h-auto px-2 py-0.5 border-0 bg-secondary rounded-full shadow-none text-primary font-medium text-base hover:bg-secondary/80 transition-colors focus:ring-0 focus:ring-offset-0 gap-1 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:opacity-70">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-lg">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="w-full px-4 py-1 md:px-4 md:py-4">
          {/* Logo and Filter Row */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-2.5 shrink-0">
            <img
              src="/logo-text.png"
              alt="Cardboard Maid"
              className="h-7 md:h-12"
            />
            </Link>

            {/* Filter Sentence - Desktop */}
            <div className="flex-1 min-w-0 flex justify-center hidden md:block">
              <p className="text-base text-foreground leading-relaxed flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-muted-foreground -ml-1.5">I want a game that takes</span>
                <InlineSelect
                  value={getCurrentPlaytimeValue()}
                  onValueChange={handlePlaytimeChange}
                  options={playtimeOptions}
                />
                <span className="text-muted-foreground">with</span>
                <InlineSelect
                  value={filters.playerCount?.toString() || "any"}
                  onValueChange={handlePlayerChange}
                  options={playerOptions}
                />
                <span className="text-muted-foreground">with</span>
                <span className="flex items-center gap-1">
                  <Select value={getCategoryValue()} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="inline-flex w-auto h-auto px-2 py-0.5 border-0 bg-secondary rounded-full shadow-none text-primary font-medium text-base hover:bg-secondary/80 transition-colors focus:ring-0 focus:ring-offset-0 gap-1 [&>svg]:w-3.5 [&>svg]:h-3.5 [&>svg]:opacity-70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl max-h-96 overflow-y-auto">
                      <SelectItem value="_all_categories" className="cursor-pointer rounded-lg">
                        any category
                      </SelectItem>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer rounded-lg">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.category && (
                    <button
                      onClick={() => handleCategoryChange("_all_categories")}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Clear category filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
                <span className="text-muted-foreground">sort by</span>
                <span className="flex items-center gap-1">
                  <InlineSelect
                    value={sortBy}
                    onValueChange={(v) => onSortChange(v as SortOption)}
                    options={sortOptions}
                  />
                  {isDirectional && (
                    <button
                      onClick={onSortDirectionToggle}
                      className="w-7 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                      title={`Currently: ${sortDirection === 'asc' ? 'ascending' : 'descending'} (click to reverse)`}
                    >
                      <ArrowUp className={`w-3.5 h-3.5 -mr-0.5 ${sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <ArrowDown className={`w-3.5 h-3.5 ${sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  )}
                  {sortBy === "random" && onReshuffle && (
                    <button
                      onClick={onReshuffle}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                      title="Shuffle"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              </p>
            </div>

            {/* Mobile Filter Button & Theme Toggle */}
            <div className="flex-1 md:hidden flex items-center justify-end gap-2">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Filter</span>
              </button>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredCount}</span>
                {filteredCount !== totalGames && <span>/{totalGames}</span>} games
              </div>
              <ThemeToggle />
            </div>

            {/* Results Count & Theme Toggle - Desktop */}
            <div className="flex items-center gap-2 shrink-0 hidden md:flex">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredCount}</span>
                {filteredCount !== totalGames && <span>/{totalGames}</span>} games
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Filter Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Filter Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-card shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Playtime Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Playtime</label>
                <Select value={getCurrentPlaytimeValue()} onValueChange={handlePlaytimeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl">
                    {playtimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-lg">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Player Count Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Number of Players</label>
                <Select value={filters.playerCount?.toString() || "any"} onValueChange={handlePlayerChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl">
                    {playerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-lg">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <div className="flex gap-2">
                  <Select value={getCategoryValue()} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl max-h-96 overflow-y-auto">
                      <SelectItem value="_all_categories" className="cursor-pointer rounded-lg">
                        any category
                      </SelectItem>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer rounded-lg">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filters.category && (
                    <button
                      onClick={() => handleCategoryChange("_all_categories")}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Clear category filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Sort By</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border shadow-elevated z-50 rounded-xl max-h-96 overflow-y-auto">
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-lg">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isDirectional && (
                    <Button
                      type="button"
                      onClick={onSortDirectionToggle}
                      variant="outline"
                      className="shrink-0 px-1.5"
                      title={`Currently: ${sortDirection === 'asc' ? 'ascending' : 'descending'} (click to reverse)`}
                    >
                      <ArrowUp className={`w-4 h-4 ${sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                      <ArrowDown className={`w-4 h-4 ${sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    </Button>
                  )}
                  {sortBy === "random" && onReshuffle && (
                    <Button
                      type="button"
                      onClick={onReshuffle}
                      variant="outline"
                      className="shrink-0"
                      title="Shuffle"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Results Info */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-center text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredCount}</span>
                  {filteredCount !== totalGames && <span> of {totalGames}</span>} games
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
