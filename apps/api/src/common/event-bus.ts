import { EventEmitter } from 'events';

export interface DomainEvent {
  type: string;
  accountId: string;
  userId: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit(event: DomainEvent) {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event); // wildcard listener
  }

  on(eventType: string, listener: (event: DomainEvent) => void) {
    this.emitter.on(eventType, listener);
  }

  off(eventType: string, listener: (event: DomainEvent) => void) {
    this.emitter.off(eventType, listener);
  }

  onAll(listener: (event: DomainEvent) => void) {
    this.emitter.on('*', listener);
  }
}
