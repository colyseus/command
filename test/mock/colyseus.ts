import nanoid from "nanoid";

export class Client {
  sessionId: string = nanoid(9);
  messages: any[] = [];
}

export class Room<T = any> {
  state: T;
  clients: Client[] = [];

  setState(state: T) {
    this.state = state;
  }

  onJoin(client: Client) {
    this.clients.push(client);
  }

  broadcast(data: any, ...args: any[]) {
    this.clients.forEach(client => client.messages.push(data));
  }

  send(client: Client, data: any) {
    client.messages.push(data);
  }

  onLeave(client: Client) {
    const index = this.clients.indexOf(client);
    if (index !== -1) {
      this.clients.splice(index, 1);
    }
  }

}