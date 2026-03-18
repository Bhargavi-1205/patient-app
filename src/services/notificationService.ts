// SSE-based Notification Service — equivalent to Flutter's NotificationsRepository
// Uses XMLHttpRequest for SSE streaming (React Native doesn't support fetch ReadableStream)

const SSE_BASE = 'https://devpatientapi.makoplus.com/v1';
const RECONNECT_DELAY = 5000; // 5 seconds

export interface SSENotification {
    notificationId: string;
    payload: Record<string, any>;
    unreadCount: number;
    read: boolean;
}

type NotificationCallback = (notification: SSENotification) => void;
type ConnectionCallback = (connected: boolean) => void;

class NotificationService {
    private xhr: XMLHttpRequest | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isConnected = false;
    private isConnecting = false;
    private currentMobile: string | null = null;
    private lastProcessedIndex = 0;

    private onNotification: NotificationCallback | null = null;
    private onConnectionChange: ConnectionCallback | null = null;

    /**
     * Set callback for incoming notifications
     */
    setNotificationListener(cb: NotificationCallback) {
        this.onNotification = cb;
    }

    /**
     * Set callback for connection status changes
     */
    setConnectionListener(cb: ConnectionCallback) {
        this.onConnectionChange = cb;
    }

    /**
     * Connect to the SSE notification stream
     */
    async connect(mobile: string) {
        if (this.isConnecting) return;

        this.currentMobile = mobile;
        this.isConnecting = true;
        this.onConnectionChange?.(false);

        // Close any existing connection
        this.closeConnection();

        try {
            const url = `${SSE_BASE}/notifications?patient_mobile=${mobile}`;

            this.xhr = new XMLHttpRequest();
            this.xhr.open('GET', url, true);
            this.xhr.setRequestHeader('Accept', 'text/event-stream');
            this.xhr.setRequestHeader('Cache-Control', 'no-cache');

            this.lastProcessedIndex = 0;

            this.xhr.onreadystatechange = () => {
                if (!this.xhr) return;

                if (this.xhr.readyState === 3) {
                    // LOADING — data is being received
                    if (!this.isConnected) {
                        this.isConnected = true;
                        this.isConnecting = false;
                        this.onConnectionChange?.(true);
                    }

                    // Process new data since last check
                    const newData = this.xhr.responseText.substring(this.lastProcessedIndex);
                    this.lastProcessedIndex = this.xhr.responseText.length;

                    if (newData) {
                        this.processChunk(newData);
                    }
                } else if (this.xhr.readyState === 4) {
                    // DONE — connection closed
                    this.handleDisconnection();
                }
            };

            this.xhr.onerror = () => {
                this.handleDisconnection();
            };

            this.xhr.ontimeout = () => {
                this.handleDisconnection();
            };

            this.xhr.send();
        } catch (e) {
            this.isConnecting = false;
            this.handleDisconnection();
        }
    }

    /**
     * Process incoming SSE chunk data
     */
    private processChunk(chunk: string) {
        if (chunk.trim().length === 0) {
            // Heartbeat
            return;
        }

        // Split by double newlines to get individual SSE events
        const events = chunk.split('\n\n');
        for (const event of events) {
            const trimmed = event.trim();
            if (trimmed.length === 0) continue;
            this.processEvent(trimmed);
        }
    }

    /**
     * Process a single SSE event
     */
    private processEvent(event: string) {
        const lines = event.split('\n');
        let eventType: string | null = null;
        let eventData = '';

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
                const dataLine = line.replace('data:', '').trim();
                if (dataLine) {
                    eventData += dataLine;
                }
            }
        }

        // Skip empty data (heartbeats)
        if (!eventData || eventData === 'null' || eventData === '{}') {
            return;
        }

        // Match Flutter: accept both spellings
        if (eventType === 'new_notification' || eventType === 'new_notificaton') {
            try {
                const decoded = JSON.parse(eventData);
                const notification: SSENotification = {
                    notificationId: decoded.notification_id || '',
                    payload: decoded.payload || {},
                    unreadCount:
                        typeof decoded.unread_count === 'number'
                            ? decoded.unread_count
                            : 0,
                    read: decoded.read === true,
                };
                this.onNotification?.(notification);
            } catch (e) {
                // JSON parse error - skip
            }
        }
    }

    /**
     * Handle disconnection and schedule reconnection
     */
    private handleDisconnection() {
        if (!this.isConnected && !this.isConnecting) return;

        this.isConnecting = false;
        this.isConnected = false;
        this.onConnectionChange?.(false);

        this.scheduleReconnection();
    }

    /**
     * Schedule automatic reconnection
     */
    private scheduleReconnection() {
        if (this.isConnecting || this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.currentMobile && !this.isConnecting) {
                this.connect(this.currentMobile);
            }
        }, RECONNECT_DELAY);
    }

    /**
     * Close the current connection
     */
    private closeConnection() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.xhr) {
            this.xhr.abort();
            this.xhr = null;
        }
        this.lastProcessedIndex = 0;
        if (this.isConnected) {
            this.isConnected = false;
            this.onConnectionChange?.(false);
        }
        this.isConnecting = false;
    }

    /**
     * Manual reconnect
     */
    async reconnect() {
        if (this.currentMobile) {
            await this.connect(this.currentMobile);
        }
    }

    /**
     * Mark all notifications as read — matches Flutter's MarkAllAsRead event
     */
    async markAllAsRead(mobile: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${SSE_BASE}/notifications/mark-read?patient_mobile=${mobile}`,
                { method: 'POST' },
            );
            if (response.ok) {
                const body = await response.text();
                return body.includes('"ok":true') || body.includes('"ok": true');
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Clear all notifications — matches Flutter's ClearAllNotifications event
     */
    async clearAll(mobile: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${SSE_BASE}/notifications/clear-all?patient_mobile=${mobile}`,
                { method: 'POST' },
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get connection status
     */
    getIsConnected() {
        return this.isConnected;
    }

    /**
     * Dispose and clean up
     */
    dispose() {
        this.closeConnection();
        this.onNotification = null;
        this.onConnectionChange = null;
        this.currentMobile = null;
    }
}

export const notificationService = new NotificationService();
