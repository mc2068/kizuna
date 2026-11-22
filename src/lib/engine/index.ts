// TEMPORARY (until #3/#4 merges): the public engine entry point (Contract 1).
// UI code imports from "@/lib/engine" only; when Hamza's port lands it replaces this file and the
// tool switches to the real engine with no change on the tool side.
export * from "./fake";
