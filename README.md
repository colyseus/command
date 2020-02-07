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

- See [action definitions](https://github.com/endel/actions/blob/f2c4984afe6420ceea9643ad8e8225fb7fd6f978/test/scenarios/CardGameScenario.ts#L18-L49)
- See [usage](https://github.com/endel/actions/blob/f2c4984afe6420ceea9643ad8e8225fb7fd6f978/test/Test.ts#L16-L36)
- See [implementation](https://github.com/endel/actions/blob/master/src/index.ts)




## License

MIT