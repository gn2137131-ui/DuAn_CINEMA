import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = 'http://localhost:8080/ws-cinema';

class SocketAdminService {
    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            console.log('Admin connected to WebSocket STOMP server', frame);
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };
    }

    connect() {
        if (!this.client.active) {
            this.client.activate();
        }
    }

    disconnect() {
        if (this.client.active) {
            this.client.deactivate();
        }
    }

    subscribe(topic, callback) {
        return this.client.subscribe(topic, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            } else {
                callback("got empty message");
            }
        });
    }

    sendMessage(destination, body) {
        this.client.publish({
            destination: destination,
            body: JSON.stringify(body)
        });
    }
}

export const socketAdminService = new SocketAdminService();
