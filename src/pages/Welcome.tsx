import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { useValidateUsername } from "@/hooks/use-bgg-api";

const Welcome = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(() => {
    // Check URL params first, then localStorage
    return searchParams.get("username") || localStorage.getItem("bgg-username") || "";
  });
  const [submittedUsername, setSubmittedUsername] = useState("");
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();

  // Use React Query to validate username against BGG API
  const { data: userInfo, isLoading, error } = useValidateUsername(
    submittedUsername,
    !!submittedUsername
  );

  // Handle validation success/error with useEffect to avoid navigation during render
  useEffect(() => {
    if (userInfo && submittedUsername) {
      // User validated successfully - save and navigate
      localStorage.setItem("bgg-username", submittedUsername);
      localStorage.setItem("bgg-user-id", userInfo.id);
      navigate(`/collection/${submittedUsername}`);
      // Reset to prevent double-navigation
      setSubmittedUsername("");
    } else if (error && submittedUsername) {
      // Show validation error
      setValidationError(error instanceof Error ? error.message : "Invalid username");
      setSubmittedUsername("");
    }
  }, [userInfo, error, submittedUsername, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setValidationError("Please enter a username");
      return;
    }

    if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
      setValidationError("Username must be between 2 and 30 characters");
      return;
    }

    setValidationError("");
    setSubmittedUsername(trimmedUsername);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.png"
            alt="Cardboard Maid Logo"
            className="w-72 rounded-3xl mb-8 glow-primary object-cover"
          />
          <p className="text-center text-muted-foreground leading-relaxed">
            Your personal assistant for planning the perfect game night.
            Browse your BoardGameGeek collection and discover your next favorite game.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-14">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-3">
              BoardGameGeek username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationError("");
              }}
              className="text-base h-12 bg-card rounded-lg"
              autoFocus
              maxLength={30}
              disabled={isLoading}
            />
            {validationError && (
              <p className="text-destructive text-sm mt-2">{validationError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-xl glow-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              "Validating..."
            ) : (
              <>
                View Collection
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have a BGG account?{" "}
          <a
            href="https://boardgamegeek.com/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Create one free
          </a>
        </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Welcome;
