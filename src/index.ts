import { Room, Client } from "colyseus";

export type IClient = { sessionId: string };

export abstract class Command<State, Payload = never> {
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
    Array<Command<any, any>> |
    void |
    Promise<Array<Command<any, any>>> |
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

  async dispatch<T extends Command<any, any>>(command: T, payload?: T['payload']): Promise<boolean> {
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
          nextCommands = (await nextCommands);
        }

        if (
          Array.isArray(nextCommands) &&
          nextCommands[0] &&
          nextCommands[0] instanceof Promise
        ) {
          nextCommands = await Promise.all(nextCommands);
        }

        console.log("NEXT COMMANDS:", nextCommands);

      } else {
        success = false;
      }

    } catch (e) {
      console.log("ERROR!", e);
      success = false;
      throw e;
    }

    //
    // Trigger next commands!
    //
    if (Array.isArray(nextCommands)) {
      for (let i=0; i<nextCommands.length; i++) {
        if (!nextCommands[i]) {
          console.log("INVALID COMMAND AS A RESULT FROM", command.constructor.name);
        }
        this.dispatch(nextCommands[i]);
      }
    }

    return success;
  }
}
