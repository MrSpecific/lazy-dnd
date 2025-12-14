// Empty shim for thread-stream to avoid bundling server-only code in client
export default class ThreadStream {
  constructor() {}
  write() {}
  end() {}
}
