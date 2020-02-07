# @colyseus/actions

**Why?**

- Models ([`@colyseus/schema`](https://github.com/colyseus/schema)) should contain only data, no logic.
- Game Rooms should act as a Controller, and contain only glue code between data sent by the

**Inspiration:**

- Vuex
- Flux

## Current problems

- Validating actions should be part of the design
- Arguments for actions should be strongly typed via TypeScript

## License

MIT