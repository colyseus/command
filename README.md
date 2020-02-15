# @colyseus/command

**Why?**

- Models ([`@colyseus/schema`](https://github.com/colyseus/schema)) should contain only data, without game logic.
- Rooms should have a little code as possible, and forward actions to other structures

The command pattern has several advantages, such as:

- It decouples the classes that invoke the operation from the object that knows how to execute the operation.
- It allows you to create a sequence of commands by providing a queue system.
- Implementing extensions to add a new command is easy and can be done without changing the existing code.
- Have strict control over how and when commands are invoked.
- The code is easier to use, understand and test since the commands simplify the code.

## How it works

- See [command definitions](https://github.com/endel/actions/blob/master/test/scenarios/CardGameScenario.ts)
- See [usage](https://github.com/endel/actions/blob/master/test/Test.ts)
- See [implementation](https://github.com/endel/actions/blob/master/src/index.ts)




## License

MIT
