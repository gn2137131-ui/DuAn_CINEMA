import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws-cinema';

class SocketService {
    public client: Client;

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            // console.log('Connected to WebSocket STOMP server', frame);
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };
    }

    public connect() {
        if (!this.client.active) {
            this.client.activate();
        }
    }

    public disconnect() {
        if (this.client.active) {
            this.client.deactivate();
        }
    }

    public subscribe(topic: string, callback: (message: any) => void) {
        let subscription: any = null;
        let isUnsubscribed = false;

        const trySubscribe = () => {
            if (isUnsubscribed) return;
            if (this.client.connected) {
                subscription = this.client.subscribe(topic, (message) => {
                    if (message.body) {
                        try {
                            callback(JSON.parse(message.body));
                        } catch (e) {
                            console.error('WebSocket: Không thể parse JSON từ message body:', message.body, e);
                            callback(message.body);
                        }
                    } else {
                        callback("got empty message");
                    }
                });
            } else {
                setTimeout(trySubscribe, 200);
            }
        };

        trySubscribe();

        return {
            unsubscribe: () => {
                isUnsubscribed = true;
                if (subscription) {
                    subscription.unsubscribe();
                }
            }
        };
    }

    public sendMessage(destination: string, body: any) {
        if (this.client.connected) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        } else {
            console.warn("STOMP connection not ready. Cannot send message to " + destination);
        }
    }
}

export const socketService = new SocketService();
