/** Drain admitted API work before flushing, retaining a live server on failure. */
export function createShutdown({ flush, close, exit, pause, resume, report }) {
  let stopping = false;
  let active = 0;
  let drained;
  let pending;
  return {
    get stopping() { return stopping; },
    enter() {
      if (stopping) return null;
      active++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        if (--active === 0 && drained) drained();
      };
    },
    shutdown() {
      if (pending) return pending;
      stopping = true;
      pending = Promise.resolve().then(async () => {
        try {
          pause();
          if (active) await new Promise(resolve => { drained = resolve; });
          await flush();
          await close();
          exit();
        } catch (error) {
          report("shutdown", error.code || "UNKNOWN");
          stopping = false;
          resume();
        } finally {
          drained = null;
          pending = null;
        }
      });
      return pending;
    },
  };
}
