import { Room } from "colyseus";

export type IClient = Partial<{ sessionId: string }>;

export abstract class Command<State = any, T = any> {
  payload: T;

  room: Room<State>;
  state: State;

  private nextCommands: Array<{ command: Command, client: IClient }>;

  constructor(payload?: T) {
    this.payload = payload;
  }

  abstract execute(client?: IClient);

  validate?(client?: IClient);

  dispatch(command: Command, client?: IClient) {
    if (!this.nextCommands) { this.nextCommands = []; }
    this.nextCommands.push({ command, client });
  }
}

export class Dispatcher {
  room: any;

  constructor(room: any) {
    this.room = room;
  }

  dispatch(command: Command, client?: IClient) {
    try {
      command.room = this.room;
      command.state = this.room.state;

      if (
        !command.validate ||
        command.validate(client)
      ) {
        command.execute(client);
      }

    } catch (e) {
      console.log("ERROR!", e);

      //
      // If 'client' has been provided, expose error to it.
      //
      if (client) {
        this.room.send(client, { error: e.message });
      }
    }

    //
    // Trigger next commands!
    //
    if (command['nextCommands']) {
      command['nextCommands'].forEach((next) =>
        this.dispatch(next.command, next.client));
    }
  }
}