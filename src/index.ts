import type { Room } from "colyseus";

import debug from "debug";
const debugCommand = debug('colyseus:command');

type SyncResult<R> = R extends Command | Command[] ? void | Promise<void> : R;
type AsyncResult<R> = R extends Command | Command[] ? void : R;
type Result<R> = R extends Promise<infer U> ? Promise<AsyncResult<U>> : SyncResult<R>;

/**
 * What `dispatcher.dispatch(command)` returns, given the return type of
 * `command.execute()`. Returned commands are dispatched as children and
 * produce no value; anything else is passed through.
 *
 * `undefined` is also possible when the dispatcher is stopped or `validate()`
 * fails.
 */
export type DispatchResult<T extends Command> = Result<ReturnType<T['execute']>>;

export abstract class Command<R extends Room = Room, Payload = unknown> {
  payload: Payload;

  room: R;
  state: R['state'];
  clock: Room['clock'];

  setPayload(payload: this['payload']) {
    this.payload = payload;
    return this;
  }

  validate?(payload: this['payload']): boolean;

  /**
   * Runs the command. The return value decides what happens next:
   *
   * - A `Command`, or an array containing commands: they're dispatched in
   *   sequence after this one, and `dispatch()` returns nothing.
   * - Anything else: returned as-is from `dispatch()` (or resolved by its
   *   promise, when `execute()` is async).
   *
   * @example
   * class RollDice extends Command<MyRoom, { sides: number }> {
   *   execute({ sides } = this.payload) {
   *     return Math.ceil(Math.random() * sides);
   *   }
   * }
   *
   * const roll = this.dispatcher.dispatch(new RollDice(), { sides: 6 }); // number
   */
  abstract execute(payload: this['payload']): unknown;

  /**
   * Delay the execution by `milliseconds`
   * @param milliseconds
   */
  protected delay(milliseconds: number) {
    return new Promise(resolve => this.clock.setTimeout(resolve, milliseconds));
  }
}

export class Dispatcher<R extends Room> {
  room: R;
  stopped: boolean = false;

  constructor(room: R) {
    this.room = room;
  }

  stop() {
    this.stopped = true;
  }

  resume() {
    this.stopped = false;
  }

  dispatch<T extends Command>(command: T, payload?: T['payload']): DispatchResult<T> | undefined {
    if (this.stopped) {
      debugCommand(`dispatcher is stopped -> ${command.constructor.name} ${(command.payload) ? `(${JSON.stringify(command.payload)})` : ''}`);
      return undefined;
    }

    command.room = this.room;
    command.state = this.room.state;
    command.clock = this.room.clock;

    if (payload) {
      command.setPayload(payload);
    }

    if (command.validate && !command.validate(command.payload)) {
      const commandPayload = `${(command.payload) ? `(${JSON.stringify(command.payload)})` : ''}`;
      debugCommand(`invalid -> ${command.constructor.name} ${commandPayload}`);
      return undefined;
      // throw new Error(`${command.constructor.name}: invalid -> ${commandPayload}`);
    }

    if (debugCommand.enabled) {
      debugCommand(`execute -> ${command.constructor.name} ${(command.payload) ? `(${JSON.stringify(command.payload)})` : ''}`);
    }

    const result = command.execute(command.payload);

    if (result instanceof Promise) {
      return result.then(async (value) => {
        const children = getChildCommands(value);
        if (!children) {
          return value;
        }

        for (let i = 0; i < children.length; i++) {
          await this.dispatch(children[i]);
        }
      }) as DispatchResult<T>;
    }

    const children = getChildCommands(result);
    if (!children) {
      return result as DispatchResult<T>;
    }

    // stay synchronous until a child turns out to be async
    let pending: Promise<unknown> | undefined;
    for (let i = 0; i < children.length; i++) {
      if (pending) {
        pending = pending.then(() => this.dispatch(children[i]));

      } else {
        const childResult = this.dispatch(children[i]);
        if (childResult instanceof Promise) {
          pending = childResult;
        }
      }
    }

    // children's own results aren't the parent's
    return pending?.then(() => undefined) as DispatchResult<T>;
  }
}

// duck-typed: `instanceof` breaks when both the CJS and ESM builds get loaded
function isCommand(value: any): value is Command {
  return typeof value?.execute === "function";
}

function getChildCommands(result: unknown): Command[] | undefined {
  if (isCommand(result)) {
    return [result];
  }
  // a stray non-command still fails loudly instead of skipping its siblings
  if (Array.isArray(result) && result.some(isCommand)) {
    return result;
  }
  return undefined;
}
