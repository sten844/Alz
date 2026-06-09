import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useSearch } from "wouter";

export default function UnsubscribePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email") || "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const unsubMutation = trpc.subscribers.unsubscribe.useMutation({
    onSuccess: () => setDone(true),
    onError: () => setError(true),
  });

  useEffect(() => {
    if (email) {
      unsubMutation.mutate({ email });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Avprenumerera</h1>
        {!email ? (
          <p className="text-lg text-foreground/70">Ingen e-postadress angiven.</p>
        ) : done ? (
          <>
            <p className="text-lg text-foreground/70">
              <strong>{email}</strong> har avprenumererats.
            </p>
            <p className="text-foreground/60">Du kommer inte längre få mejl från oss.</p>
          </>
        ) : error ? (
          <p className="text-lg text-red-600">Något gick fel. Försök igen senare.</p>
        ) : (
          <p className="text-lg text-foreground/70">Avprenumererar...</p>
        )}
        <a href="/" className="inline-block mt-4 text-[#c05746] underline">
          Tillbaka till sajten
        </a>
      </div>
    </div>
  );
}
