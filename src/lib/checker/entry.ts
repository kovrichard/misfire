import { analyze } from "./detect";
import { mountPanel } from "./panel";
import { readSnapshot } from "./snapshot";

const WATCH_MS = 20000;
const POLL_MS = 1000;

function start(): void {
  const panel = mountPanel();
  const render = () => {
    panel.update(analyze(readSnapshot()));
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  };

  render();

  const observer = new PerformanceObserver(schedule);
  observer.observe({ type: "resource", buffered: false });
  const poll = setInterval(schedule, POLL_MS);

  setTimeout(() => {
    observer.disconnect();
    clearInterval(poll);
  }, WATCH_MS);
}

start();
