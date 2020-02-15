import { Room, Client } from "colyseus";

export type IClient = { sessionId: string };

export abstract class Command<State = any, Payload = any> {
  payload: Payload;

  room: Room<State>;
  state: State;
  clock: Room['clock'];

  constructor(payload?: Payload) {
    this.payload = payload;
  }

  validate?(client?: IClient): boolean;

  abstract execute(client?: IClient):
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

  async dispatch(command: Command, client?: IClient): Promise<boolean> {
    let success: boolean = true;
    let nextCommands: void | Array<Command>;

    try {
      command.room = this.room;
      command.state = this.room.state;
      command.clock = this.room.clock;

      if (!command.validate || command.validate(client)) {
        nextCommands = await command.execute(client);

      } else {
        success = false;
      }

    } catch (e) {
      console.log("ERROR!", e);
      success = false;

      //
      // If 'client' has been provided, expose error to it.
      //
      if (client) {
        this.room.send(client as Client, { error: e.message });
      }
    }

    //
    // Trigger next commands!
    //
    if (Array.isArray(nextCommands)) {
      const results = await Promise.all(nextCommands.map((nextCommand) => {
        if (!nextCommand) {
          console.log("INVALID COMMAND AS A RESULT FROM", command.constructor.name);
        }

        return this.dispatch(nextCommand, client);
      }));
      success = results.every((result) => result === true);
    }

    return success;
  }
}
