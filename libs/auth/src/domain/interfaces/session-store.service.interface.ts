export interface ISessionStoreService {
  save(userId: number, subToken: string, signature: string, ttlSeconds: number): Promise<void>
  get(userId: number, subToken: string): Promise<string | null>
  removeAllForUser(userId: number): Promise<void>
}
