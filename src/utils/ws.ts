// src/utils/ws.ts

export interface WSMessage {
    [key: string]: any;
  }
  
  export class WSClient {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number;
    private onMessageCallbacks: ((data: any) => void)[] = [];
    private onErrorCallbacks: ((err: Event) => void)[] = [];
    private onOpenCallbacks: (() => void)[] = [];
    private onCloseCallbacks: (() => void)[] = [];
  
    constructor(url: string, reconnectInterval = 5000) {
      this.url = url;
      this.reconnectInterval = reconnectInterval;
      this.connect();
    }
  
    private connect() {
      this.socket = new WebSocket(this.url);
  
      this.socket.onopen = () => {
        console.log(`[WS] Connecté à ${this.url}`);
        this.onOpenCallbacks.forEach(cb => cb());
      };
  
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessageCallbacks.forEach(cb => cb(data));
        } catch (err) {
          console.error("[WS] Erreur parsing JSON :", err);
        }
      };
  
      this.socket.onerror = (error) => {
        console.error("[WS] Erreur WebSocket :", error);
        this.onErrorCallbacks.forEach(cb => cb(error));
      };
  
      this.socket.onclose = () => {
        console.warn(`[WS] Déconnecté de ${this.url}, reconnexion dans ${this.reconnectInterval / 1000}s...`);
        this.onCloseCallbacks.forEach(cb => cb());
        setTimeout(() => this.connect(), this.reconnectInterval);
      };
    }
  
    send(data: WSMessage) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(data));
      } else {
        console.warn("[WS] Impossible d'envoyer le message : socket non ouverte.");
      }
    }
  
    onMessage(callback: (data: any) => void) {
      this.onMessageCallbacks.push(callback);
    }
  
    onError(callback: (err: Event) => void) {
      this.onErrorCallbacks.push(callback);
    }
  
    onOpen(callback: () => void) {
      this.onOpenCallbacks.push(callback);
    }
  
    onClose(callback: () => void) {
      this.onCloseCallbacks.push(callback);
    }
  
    close() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    }
  }
  