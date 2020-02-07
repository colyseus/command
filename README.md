# @colyseus/actions

**Why?**

- Models ([`@colyseus/schema`](https://github.com/colyseus/schema)) should contain only data, without game logic.
- Rooms should have a little code as possible, and forward actions to other structures

**Inspiration:**

- Vuex
- Flux

## Current problems

- Validating actions should be part of the design
- Arguments for actions should be strongly typed via TypeScript
- An action should be able to `dispatch` more actions

- See [action definitions](https://github.com/endel/actions/blob/master/test/scenarios/CardGameScenario.ts)
- See [usage](https://github.com/endel/actions/blob/master/test/Test.ts)
- See [implementation](https://github.com/endel/actions/blob/master/src/index.ts)




## License

MIT
