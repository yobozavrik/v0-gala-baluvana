interface QueuedRequest<TData = unknown> {
  id: string
  url: string
  data: TData
  timestamp: number
  retryCount: number
}

class OfflineQueue {
  private dbName = "FactoryAppQueue"
  private storeName = "requests"
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" })
        }
      }
    })
  }

  async addRequest<TData>(url: string, data: TData): Promise<void> {
    if (!this.db) await this.init()

    const request: QueuedRequest<TData> = {
      id: Date.now().toString(),
      url,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }

    const transaction = this.db!.transaction([this.storeName], "readwrite")
    const store = transaction.objectStore(this.storeName)
    store.add(request)
  }

  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeRequest(id: string): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.storeName], "readwrite")
    const store = transaction.objectStore(this.storeName)
    store.delete(id)
  }

  async processQueue(): Promise<void> {
    const requests = await this.getQueuedRequests()

    for (const request of requests) {
      try {
        const response = await fetch(request.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.data),
        })

        if (response.ok) {
          await this.removeRequest(request.id)
        }
      } catch (error) {
        console.log("Failed to process queued request:", error)
      }
    }
  }
}

export const offlineQueue = new OfflineQueue()
