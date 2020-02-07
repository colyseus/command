export type IClient = Partial<{ sessionId: string }>;
export type ICallback<State=any> = (state: State, payload: any, client?: IClient) => void;
export type IMutationActions<Action extends string, State=any> = { [key in Action]?: ICallback<State> };

export class Dispatcher<Actions extends string> {
  room: any;
  mutations: { [key in Actions]?: ICallback } = {};

  constructor(room: any) {
    this.room = room;
  }

  register(mutations: IMutationActions<Actions>) {
    for (const action in mutations) {
      this.mutations[action] = mutations[action];
    }
  }

  dispatch(action: Actions, payload: any, client?: IClient) {
    try {
      this.mutations[action](this.room.state, payload, client);

    } catch (e) {
      console.log("ERROR!", e);

      //
      // If 'client' has been provided, expose error to it.
      //
      if (client) {
        this.room.send(client, { error: e.message });
      }
    }
  }
}