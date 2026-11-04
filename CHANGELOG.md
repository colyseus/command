# Changelog

## 1.0.0

- `execute()` can now return a value: `dispatch()` returns it (or resolves to it, for async commands) typed from the command, instead of failing with `command.execute is not a function`. Returned commands are still dispatched as before. [#9](https://github.com/colyseus/command/issues/9)
- ESM projects using `node16`/`nodenext` module resolution now get ESM type declarations.
- Requires TypeScript 5.7 or newer.
