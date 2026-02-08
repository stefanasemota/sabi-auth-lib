declare module '@stefanasemota/sabi-logger' {
    import { Firestore } from 'firebase-admin/firestore';

    export interface AuthEvent {
        uid: string;
        appId: string;
        eventType: 'LOGIN' | 'LOGOUT' | 'REGISTER';
        metadata?: Record<string, any>;
    }

    export function logAuthEvent(db: Firestore, event: AuthEvent): Promise<void>;
}
