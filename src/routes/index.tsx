import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const {
    data: { viewer, numbers },
  } = useSuspenseQuery(convexQuery(api.myFunctions.listNumbers, { count: 10 }));

  const addNumber = useMutation(api.myFunctions.addNumber);
  const generateBAMLNumber = useAction(
    api.bamlActions.generateRandomNumberWithBAML,
  );

  const [addState, setAddState] = useState<"idle" | "pending" | "done">(
    "idle",
  );
  const [bamlState, setBamlState] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  const addFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const bamlFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [bamlResult, setBamlResult] = useState<
    {
      success: boolean;
      number?: number;
      message: string;
      error?: string;
    } | null
  >(null);

  useEffect(() => {
    return () => {
      if (addFeedbackTimeout.current) {
        clearTimeout(addFeedbackTimeout.current);
      }
      if (bamlFeedbackTimeout.current) {
        clearTimeout(bamlFeedbackTimeout.current);
      }
    };
  }, []);

  const disableAddButton = addState !== "idle";
  const disableBamlButton = bamlState !== "idle";

  return (
    <main className="p-8 flex flex-col gap-16">
      <h1 className="text-4xl font-bold text-center">
        Convex + Tanstack Start
      </h1>
      <div className="flex flex-col gap-8 max-w-lg mx-auto">
        <p>Welcome {viewer ?? "Anonymous"}!</p>
        <p>
          Click the button below and open this page in another window - this
          data is persisted in the Convex cloud database!
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            disabled={disableAddButton}
            className="bg-dark dark:bg-light text-light dark:text-dark text-sm px-4 py-2 rounded-md border-2 transition-colors duration-200 hover:bg-dark/90 dark:hover:bg-light/90 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={async () => {
              if (addState === "pending") return;
              setAddState("pending");
              try {
                await addNumber({ value: Math.floor(Math.random() * 10) });
                setAddState("done");
                if (addFeedbackTimeout.current) {
                  clearTimeout(addFeedbackTimeout.current);
                }
                addFeedbackTimeout.current = setTimeout(() => {
                  setAddState("idle");
                }, 2500);
              } catch (error) {
                console.error("Failed to add number", error);
                setAddState("idle");
              }
            }}
          >
            {addState === "pending"
              ? "Adding..."
              : addState === "done"
              ? "Added!"
              : "Add a random number"}
          </button>
          <button
            type="button"
            disabled={disableBamlButton}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md border-2 border-blue-600 transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={async () => {
              if (bamlState === "pending") return;
              setBamlState("pending");
              try {
                const result = await generateBAMLNumber({});
                setBamlResult(result);
                setBamlState("success");
                if (bamlFeedbackTimeout.current) {
                  clearTimeout(bamlFeedbackTimeout.current);
                }
                bamlFeedbackTimeout.current = setTimeout(() => {
                  setBamlState("idle");
                }, 2500);
              } catch (error) {
                setBamlResult({
                  success: false,
                  message: "Failed to generate number",
                  error: error instanceof Error
                    ? error.message
                    : "Unknown error",
                });
                setBamlState("error");
                if (bamlFeedbackTimeout.current) {
                  clearTimeout(bamlFeedbackTimeout.current);
                }
                bamlFeedbackTimeout.current = setTimeout(() => {
                  setBamlState("idle");
                }, 2500);
              }
            }}
          >
            {bamlState === "pending"
              ? "Generating..."
              : bamlState === "success"
              ? "Generated!"
              : bamlState === "error"
              ? "Failed!"
              : "Generate with BAML + Gemini"}
          </button>
        </div>
        <p>
          Numbers: {numbers?.length === 0
            ? "Click the button!"
            : (numbers?.join(", ") ?? "...")}
        </p>

        {bamlResult && (
          <div
            className={`p-4 rounded-md border-2 ${
              bamlResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <h3 className="font-bold text-sm mb-2">
              {bamlResult.success
                ? "✅ BAML Generated Number"
                : "❌ BAML Generation Failed"}
            </h3>
            <p className="text-sm">{bamlResult.message}</p>
            {bamlResult.success && bamlResult.number && (
              <p className="text-lg font-bold mt-2">
                Generated Number:{" "}
                <span className="text-2xl">{bamlResult.number}</span>
              </p>
            )}
            {bamlResult.error && (
              <p className="text-sm mt-2 text-red-600">
                Error: {bamlResult.error}
              </p>
            )}
          </div>
        )}
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            convex/myFunctions.ts
          </code>{" "}
          to change your backend
        </p>
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            src/routes/index.tsx
          </code>{" "}
          to change your frontend
        </p>
        <p>
          Open{" "}
          <a
            href="/anotherPage"
            className="text-blue-600 underline hover:no-underline"
          >
            another page
          </a>{" "}
          to send an action.
        </p>
      </div>
    </main>
  );
}
