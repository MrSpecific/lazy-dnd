// Empty shim for pino to avoid bundling server-only code in client
export default function pino() {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    trace: () => {},
  };
}
