"use client";

// Store-style configurator: inputs on the left, sticky summary on the right (bottom bar on small screens).
// No submit button: the result follows the inputs. Must sit inside <ToolStateProvider>.
import { ToolInputs } from "./ToolInputs";
import { ToolSummary } from "./ToolSummary";

export function Configurator() {
  return (
    <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.15fr]">
      <ToolInputs />
      <ToolSummary />
    </div>
  );
}
