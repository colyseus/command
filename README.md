# @colyseus/command

<img src="https://img.shields.io/travis/colyseus/command.svg?style=for-the-badge" alt="Build status" />

This is an early version of the Command Pattern to be used along with Colyseus. The API may change at any time.

**Why?**

- Models ([`@colyseus/schema`](https://github.com/colyseus/schema)) should contain only data, without game logic.
- Rooms should have a little code as possible, and forward actions to other structures

**The command pattern has several advantages, such as:**

- It decouples the classes that invoke the operation from the object that knows how to execute the operation.
- It allows you to create a sequence of commands by providing a queue system.
- Implementing extensions to add a new command is easy and can be done without changing the existing code.
- Have strict control over how and when commands are invoked.
- The code is easier to use, understand and test since the commands simplify the code.

## Usage

```
npm install --save @colyseus/command
```

```typescript
import { Room } from "colyseus";
import { Dispatcher } from "@colyseus/command";

class MyRoom extends Room<YourState> {
  dispatcher: Dispatcher = new Dispatcher(this);

  onCreate() {
    this.setState(new YourState());
  }

  onJoin(client, options) {
    this.dispatcher.dispatch(new OnJoinCommand(), { sessionId: client.sessionId });
  }
}
```

```typescript
import { Command } from "@colyseus/command";

export class OnJoinCommand extends Command<YourState, { sessionId: string }> {
  execute({ sessionId }) {
    this.state.players[sessionId] = new Player();
  }
}
```

## See more

- See [command definitions](https://github.com/endel/actions/blob/master/test/scenarios/CardGameScenario.ts)
- See [usage](https://github.com/endel/actions/blob/master/test/Test.ts)
- See [implementation](https://github.com/endel/actions/blob/master/src/index.ts)


## License

MIT
