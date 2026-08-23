import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  window.history.replaceState({}, "", "/");
});

it("publishes a demo share into the active management list without contacting an API", async () => {
  vi.stubEnv("VITE_DEMO_MODE", "true");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState({}, "", "/app/partager");
  const { default: App } = await import("./App");
  const user = userEvent.setup();

  render(<App />);
  expect(await screen.findByRole("heading", { name: "Partager ma place" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(1);

  await user.click(screen.getByRole("button", { name: "Partager ma place" }));

  expect(await screen.findByRole("status")).toHaveTextContent(/A-24 est partagée/i);
  expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(2);
  expect(fetchMock).not.toHaveBeenCalled();
});
