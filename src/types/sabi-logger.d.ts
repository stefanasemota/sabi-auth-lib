declare module '@stefanasemota/sabi-logger' {
    export interface AuthEvent {
        uid: string;
        appId: string;
        eventType: 'LOGIN' | 'LOGOUT' | 'REGISTER';
        metadata?: Record<string, any>;
    }

    export function logAuthEvent(event: AuthEvent): Promise<void>;
}
