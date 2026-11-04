# Changelog

## 1.0.0

- `execute()` can now return a value: `dispatch()` returns it (or resolves to it, for async commands) typed from the command, instead of failing with `command.execute is not a function`. Returned commands are still dispatched as before. [#9](https://github.com/colyseus/command/issues/9)
- `dispatch()` no longer throws when `validate()` fails on a payload that can't be serialized to JSON, such as one holding a client.
- Dispatching allocates less and is faster, most of all when `validate()` fails or the dispatcher is stopped (the payload is only serialized for debug logging), and for async commands.
- ESM projects using `node16`/`nodenext` module resolution now get ESM type declarations.
- Requires TypeScript 5.7 or newer.
