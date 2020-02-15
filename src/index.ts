import { Room } from "colyseus";

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
    let nextCommands: any;

    try {
      command.room = this.room;
      command.state = this.room.state;
      command.clock = this.room.clock;

      if (payload) {
        command.setPayload(payload);
      }

      if (!command.validate || command.validate(command.payload)) {
        nextCommands = command.execute(command.payload);

        if (nextCommands instanceof Promise) {
          return nextCommands.then(childCommands => this.handleCommandResponse(command, childCommands));

        } else {
          return this.handleCommandResponse(command, nextCommands);
        }

      } else {
        // TODO: log validation failed
      }

    } catch (e) {
      // TODO: log error
      console.log("ERROR!", e);
      throw e;
    }
  }

  private handleCommandResponse(
    source: Command,
    nextCommands: void | Command[] | Array<Promise<Command[] | void>>
  ) {
    const results: any[] = [];

    //
    // Trigger next commands!
    //
    if (Array.isArray(nextCommands)) {

      for (let i = 0; i < nextCommands.length; i++) {
        if (!nextCommands[i]) { continue; }

        if (nextCommands[i] instanceof Promise) {
          results.push(
            (nextCommands[i] as Promise<Command[] | void>).then((nextCommands) =>
              this.handleCommandResponse(source, nextCommands))
          );

        } else {
          results.push(this.dispatch(nextCommands[i] as Command));
        }
      }
    }

    return Promise.all(results);
  }
}