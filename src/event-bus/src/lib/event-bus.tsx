/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Type definitions for the EventBus
 */
export type EventKey = string | symbol;
export type EventCallback<T = any> = (payload?: T) => void;
export type UnsubscribeFn = () => void;

// Using a single type for listeners to avoid generic compatibility issues
interface Listener {
  callback: EventCallback<any>;
  context: unknown;
  once: boolean;
}

/**
 * Enhanced EventBus implementation that combines the best of both approaches:
 * - TypeScript for better type safety
 * - Set-based storage for better performance
 * - Comprehensive API with all useful features
 * - Unsubscribe functions for convenient cleanup
 */
class EventBus {
  /**
   * Map of events to sets of listeners
   * Using Map and custom Listener objects for better performance and flexibility
   */
  private listeners: Map<EventKey, Set<Listener>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Name or symbol of the event to subscribe to
   * @param callback - Function to call when event is emitted
   * @param context - Context to bind the callback to (optional)
   * @returns Unsubscribe function
   */
  public on<T = any>(
    event: EventKey,
    callback: EventCallback<T>,
    context: unknown = null
  ): UnsubscribeFn {
    // Initialize set for this event if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listener: Listener = { callback, context, once: false };
    this.listeners.get(event)!.add(listener);

    // Return an unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        // Find and remove the specific listener
        eventListeners.forEach((l) => {
          if (l.callback === callback && l.context === context) {
            eventListeners.delete(l);
          }
        });

        // Clean up empty event sets
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param event - Name or symbol of the event to subscribe to
   * @param callback - Function to call when event is emitted
   * @param context - Context to bind the callback to (optional)
   * @returns Unsubscribe function
   */
  public once<T = any>(
    event: EventKey,
    callback: EventCallback<T>,
    context: unknown = null
  ): UnsubscribeFn {
    // Initialize set for this event if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listener: Listener = { callback, context, once: true };
    this.listeners.get(event)!.add(listener);

    // Return an unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((l) => {
          if (l.callback === callback && l.context === context) {
            eventListeners.delete(l);
          }
        });

        // Clean up empty event sets
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit an event
   * @param event - Name or symbol of the event to emit
   * @param payload - Data to pass to event listeners
   */
  public emit<T = any>(event: EventKey, payload?: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // Create a temporary array to track one-time listeners to remove
    const toRemove: Listener[] = [];

    // Call each listener with proper context and error handling
    eventListeners.forEach((listener) => {
      try {
        // Call the callback with the provided context and payload
        listener.callback.call(listener.context, payload);

        // Track if this is a one-time listener
        if (listener.once) {
          toRemove.push(listener);
        }
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });

    // Remove one-time listeners
    toRemove.forEach((listener) => {
      eventListeners.delete(listener);
    });

    // Clean up if all listeners were removed
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove specific listener for an event
   * @param event - Name or symbol of the event
   * @param callback - Callback function to remove
   * @param context - Context that was used when subscribing (optional)
   */
  public off<T = any>(
    event: EventKey,
    callback?: EventCallback<T>,
    context: unknown = null
  ): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // If no callback specified, remove all listeners for this event
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    // Remove specific callback
    eventListeners.forEach((listener) => {
      if (
        listener.callback === callback &&
        (context === null || listener.context === context)
      ) {
        eventListeners.delete(listener);
      }
    });

    // Clean up empty event sets
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event or all events
   * @param event - Name or symbol of the event (if omitted, all events are cleared)
   */
  public clear(event?: EventKey): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - Name or symbol of the event
   * @returns Number of listeners
   */
  public listenerCount(event: EventKey): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * Check if an event has any listeners
   * @param event - Name or symbol of the event
   * @returns True if the event has listeners
   */
  public hasListeners(event: EventKey): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all registered event keys
   * @returns Array of event keys
   */
  public eventNames(): EventKey[] {
    return Array.from(this.listeners.keys());
  }
}

export { EventBus };
