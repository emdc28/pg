/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */

import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { EventBus } from './event-bus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    // Spy on console.error to test error handling
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    test('should subscribe to and emit events', () => {
      const callback = vi.fn();
      eventBus.on('test', callback);

      eventBus.emit('test', 'data');

      expect(callback).toHaveBeenCalledWith('data');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test', callback1);
      eventBus.on('test', callback2);

      eventBus.emit('test', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    test('should not call subscribers of different events', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test1', callback1);
      eventBus.on('test2', callback2);

      eventBus.emit('test1', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).not.toHaveBeenCalled();
    });

    test('should not fail when emitting an event with no subscribers', () => {
      expect(() => {
        eventBus.emit('nonexistent');
      }).not.toThrow();
    });
  });

  describe('Context binding', () => {
    test('should bind callback to the provided context', () => {
      const context = { value: 42 };
      const callback = vi.fn(function (this: any) {
        return this.value;
      });

      eventBus.on('test', callback, context);
      eventBus.emit('test');

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.results[0].value).toBe(42);
    });
  });

  describe('Unsubscribing', () => {
    test('should unsubscribe using the return function', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('test', callback);

      unsubscribe();
      eventBus.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    test('should unsubscribe using off method', () => {
      const callback = vi.fn();
      eventBus.on('test', callback);

      eventBus.off('test', callback);
      eventBus.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    test('should unsubscribe all callbacks for an event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test', callback1);
      eventBus.on('test', callback2);

      eventBus.off('test');
      eventBus.emit('test', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    test('should unsubscribe based on context', () => {
      const context1 = { name: 'context1' };
      const context2 = { name: 'context2' };
      const callback = vi.fn();

      eventBus.on('test', callback, context1);
      eventBus.on('test', callback, context2);

      eventBus.off('test', callback, context1);
      eventBus.emit('test', 'data');

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Once method', () => {
    test('should trigger callback only once', () => {
      const callback = vi.fn();
      eventBus.once('test', callback);

      eventBus.emit('test', 'data1');
      eventBus.emit('test', 'data2');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('data1');
    });

    test('should handle multiple once subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.once('test', callback1);
      eventBus.once('test', callback2);

      eventBus.emit('test', 'data');
      eventBus.emit('test', 'more-data');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    test('unsubscribe should work with once', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.once('test', callback);

      unsubscribe();
      eventBus.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Clear method', () => {
    test('should remove all listeners for an event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test1', callback1);
      eventBus.on('test2', callback2);

      eventBus.clear('test1');
      eventBus.emit('test1', 'data1');
      eventBus.emit('test2', 'data2');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('data2');
    });

    test('should remove all listeners when no event specified', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test1', callback1);
      eventBus.on('test2', callback2);

      eventBus.clear();
      eventBus.emit('test1', 'data1');
      eventBus.emit('test2', 'data2');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should catch errors in listeners', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = vi.fn();

      eventBus.on('test', errorCallback);
      eventBus.on('test', normalCallback);

      eventBus.emit('test', 'data');

      expect(console.error).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Utility methods', () => {
    test('listenerCount should return correct number of listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      expect(eventBus.listenerCount('test')).toBe(0);

      eventBus.on('test', callback1);
      expect(eventBus.listenerCount('test')).toBe(1);

      eventBus.on('test', callback2);
      expect(eventBus.listenerCount('test')).toBe(2);

      eventBus.off('test', callback1);
      expect(eventBus.listenerCount('test')).toBe(1);
    });

    test('hasListeners should return correct boolean value', () => {
      const callback = vi.fn();

      expect(eventBus.hasListeners('test')).toBe(false);

      eventBus.on('test', callback);
      expect(eventBus.hasListeners('test')).toBe(true);

      eventBus.off('test', callback);
      expect(eventBus.hasListeners('test')).toBe(false);
    });

    test('eventNames should return all registered events', () => {
      eventBus.on('test1', () => {});
      eventBus.on('test2', () => {});

      const events = eventBus.eventNames();

      expect(events).toHaveLength(2);
      expect(events).toContain('test1');
      expect(events).toContain('test2');
    });
  });

  describe('Symbol support', () => {
    test('should support using Symbols as event keys', () => {
      const TEST_EVENT = Symbol('test');
      const callback = vi.fn();

      eventBus.on(TEST_EVENT, callback);
      eventBus.emit(TEST_EVENT, 'data');

      expect(callback).toHaveBeenCalledWith('data');
    });
  });

  describe('Type checking', () => {
    test('should support typed payloads', () => {
      interface UserData {
        id: number;
        name: string;
      }

      const callback = vi.fn<(userData?: UserData) => void>();
      eventBus.on<UserData>('userAdded', callback);

      const userData: UserData = { id: 1, name: 'John' };
      eventBus.emit<UserData>('userAdded', userData);

      expect(callback).toHaveBeenCalledWith(userData);
    });
  });

  describe('Memory management', () => {
    test('should clean up empty event sets', () => {
      const callback = vi.fn();
      eventBus.on('test', callback);

      // @ts-expect-error Access private property for testing
      const listeners = eventBus.listeners;
      expect(listeners.has('test')).toBe(true);

      eventBus.off('test', callback);
      expect(listeners.has('test')).toBe(false);
    });
  });
});
