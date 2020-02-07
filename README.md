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

## License

MIT