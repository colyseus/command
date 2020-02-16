import { Room } from "colyseus";
const debug = require('debug')('colyseus:command');

export abstract class Command<State = any, Payload = unknown> {
  payload: Payload;

  room: Room<State>;
  state: State;
  clock: Room['clock'];

  setPayload(payload: this['payload']) {
    this.payload = payload;
    return this;
  }

  validate?(payload: this['payload']): boolean;

  abstract execute(payload: this['payload']):
    Array<Command> |
    void |
    Promise<Array<Command>> |
    Promise<unknown>;

  /**
   * Delay the execution by `milliseconds`
   * @param milliseconds
   */
  protected delay(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

export class Dispatcher {
  room: Room;

  constructor(room: any) {
    this.room = room;
  }

  dispatch<T extends Command>(command: T, payload?: T['payload']): void | Promise<unknown> {
    command.room = this.room;
    command.state = this.room.state;
    command.clock = this.room.clock;

    if (payload) {
      command.setPayload(payload);
    }

    if (!command.validate || command.validate(command.payload)) {
      if (debug.enabled) {
        debug(`${command.constructor.name} execute${(command.payload) ? ` (${JSON.stringify(command.payload)})` : ''}`);
      }

      const result = command.execute(command.payload);

      if (result instanceof Promise) {
        return (result as Promise<Command[]>).then(async (childCommands) => {
          const nextCommands = this.getNextCommands(childCommands);

          for (let i = 0; i < nextCommands.length; i++) {
            await this.dispatch(nextCommands[i]);
          }
        });

      } else {
        const nextCommands = this.getNextCommands(result);
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

    } else if (debug.enabled) {
      debug(`${command.constructor.name} !! invalid !!${(command.payload) ? ` (${JSON.stringify(command.payload)})` : ''}`);
    }
  }

  // | Array<Promise<Command[] | void>>
  private getNextCommands(nextCommands: void | Command[]): Command[] {
    return (Array.isArray(nextCommands))
      ? nextCommands
      : [];
  }
}