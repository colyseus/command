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
    Promise<void>;

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

  dispatch<T extends Command<any, any>>(command: T, payload?: T['payload']): boolean | Promise<boolean> {
    let success: boolean = true;
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
          nextCommands.then((nextCommands) =>
            this.handleCommandResponse(command, nextCommands));

        } else {
          this.handleCommandResponse(command, nextCommands);
        }

      } else {
        success = false;
      }

    } catch (e) {
      console.log("ERROR!", e);
      success = false;
      throw e;
    }

    return success;
  }

  private handleCommandResponse(
    source: Command,
    nextCommands: void | Command[] | Array<Promise<Command[] | void>>
  ) {
    //
    // Trigger next commands!
    //
    if (Array.isArray(nextCommands)) {
      for (let i = 0; i < nextCommands.length; i++) {
        if (!nextCommands[i]) {
          continue;
        }

        if (nextCommands[i] instanceof Promise) {
          (nextCommands[i] as Promise<Command[] | void>).then((nextCommands) =>
            this.handleCommandResponse(source, nextCommands));

        } else {
          this.dispatch(nextCommands[i] as Command);
        }

      }
    }
  }
}