export async function logCronTick(): Promise<string> {
  const message = `[CRON] Tick at ${new Date().toISOString()}`
  console.log(message)
  return message
}
