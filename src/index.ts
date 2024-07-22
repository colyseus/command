import type { Room } from "colyseus";

import debug from "debug";
const debugCommand = debug('colyseus:command');

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

  abstract execute(payload: this['payload']):
    Array<Command> |
    Command |
    void |
    Promise<Array<Command>> |
    Promise<Command> |
    Promise<unknown>;

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

  dispatch<T extends Command>(command: T, payload?: T['payload']): void | Promise<unknown> {
    if (this.stopped) {
      debugCommand(`dispatcher is stopped -> ${command.constructor.name} ${(command.payload) ? `(${JSON.stringify(command.payload)})` : ''}`);
      return;
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
      throw new Error(`${command.constructor.name} invalid -> ${commandPayload}`);
    }

    if (debugCommand.enabled) {
      debugCommand(`execute -> ${command.constructor.name} ${(command.payload) ? `(${JSON.stringify(command.payload)})` : ''}`);
    }

    const result = command.execute(command.payload);

    if (result instanceof Promise) {
      return (result as Promise<Command[]>).then(async (childCommands) => {
        const nextCommands = this.getNextCommands(childCommands);

        for (let i = 0; i < nextCommands.length; i++) {
          await this.dispatch(nextCommands[i]);
        }
      });
    }

    const nextCommands = this.getNextCommands(result)
    const hasNextCommands = !!nextCommands.length

    if (hasNextCommands) {
      let lastResult: void | Promise<unknown>;

      for (let i = 0; i < nextCommands.length; i++) {
        if (lastResult instanceof Promise) {
          lastResult = lastResult.then(() => this.dispatch(nextCommands[i]));

        } else {
          lastResult = this.dispatch(nextCommands[i]);
        }
      }

      return lastResult;
    }
  }

  // | Array<Promise<Command[] | void>>
  private getNextCommands(nextCommands: void | Command | Command[]): Command[] {
    if (!nextCommands) {
      return [];
    }
    if (Array.isArray(nextCommands)) {
      return nextCommands
    }
    return [nextCommands];
  }
}
