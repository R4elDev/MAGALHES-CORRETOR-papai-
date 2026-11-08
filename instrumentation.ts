export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startIndexWorker } = await import("@/lib/search/indexer");
    startIndexWorker();
  }
}
