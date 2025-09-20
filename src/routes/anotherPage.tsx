import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { useAction } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/anotherPage")({
  component: AnotherPage,
});

function AnotherPage() {
  const callMyAction = useAction(api.myFunctions.myAction);
  const [actionState, setActionState] = useState<"idle" | "pending" | "done">(
    "idle",
  );
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data } = useSuspenseQuery(
    convexQuery(api.myFunctions.listNumbers, { count: 10 }),
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

  return (
    <main className="p-8 flex flex-col gap-16">
      <h1 className="text-4xl font-bold text-center">
        Convex + Tanstack Start
      </h1>
      <div className="flex flex-col gap-8 max-w-lg mx-auto">
        <p>Numbers: {data.numbers.join(", ")}</p>
        <p>Click the button below to add a random number to the database.</p>
        <p>
          <button
            type="button"
            disabled={actionState !== "idle"}
            className="bg-dark dark:bg-light text-light dark:text-dark text-sm px-4 py-2 rounded-md border-2 transition-colors duration-200 hover:bg-dark/90 dark:hover:bg-light/90 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={async () => {
              if (actionState === "pending") return;
              setActionState("pending");
              try {
                await callMyAction({
                  first: Math.round(Math.random() * 100),
                });
                alert("Number added!");
                setActionState("done");
                if (feedbackTimeout.current) {
                  clearTimeout(feedbackTimeout.current);
                }
                feedbackTimeout.current = setTimeout(() => {
                  setActionState("idle");
                }, 2500);
              } catch (error) {
                console.error("Failed to submit action", error);
                setActionState("idle");
              }
            }}
          >
            {actionState === "pending"
              ? "Submitting..."
              : actionState === "done"
              ? "Submitted!"
              : "Call action to add a random number"}
          </button>
        </p>
        <a href="/" className="text-blue-600 underline hover:no-underline">
          Back
        </a>
      </div>
    </main>
  );
}
