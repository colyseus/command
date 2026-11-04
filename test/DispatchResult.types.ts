/**
 * Compile-time only: `npm test` type-checks this file (`tsc -p test`), and a
 * failing `expectType` is a type error. Mocha doesn't load it.
 */
import { Command, Dispatcher, DispatchResult } from "../src";
import { CardGameRoom } from "./scenarios/CardGameScenario";
import { Returns, ReturnsAsync } from "./scenarios/ReturnValueScenario";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function expectType<_ extends true>() {}

class Child extends Command<CardGameRoom> { execute() {} }

class SyncNumber extends Command<CardGameRoom, number> { execute(n = this.payload) { return n * 2; } }
class SyncObject extends Command { execute() { return { doubled: 4 }; } }
class SyncVoid extends Command { execute() {} }
class SyncChild extends Command { execute() { return new Child(); } }
class SyncChildren extends Command { execute() { return [new Child(), new Child()]; } }
class SyncChildOrData extends Command<any, boolean> { execute(flag: boolean) { return flag ? new Child() : "skipped"; } }

class AsyncNumber extends Command { async execute() { return 4; } }
class AsyncVoid extends Command { async execute() {} }
class AsyncChildren extends Command { async execute() { return [new Child()]; } }
class AsyncChildOrData extends Command<any, boolean> { async execute(flag: boolean) { return flag ? [new Child()] : "skipped"; } }

class AnyResult extends Command { execute(): any { return 1; } }
class InheritsResult extends SyncNumber { validate() { return true; } }

// the signature 0.3.x declared on Command, copied onto a subclass
class LegacySignature extends Command {
  execute(): Array<Command> | Command | void | Promise<Array<Command>> | Promise<Command> | Promise<unknown> { return; }
}

expectType<Equals<DispatchResult<SyncNumber>, number>>();
expectType<Equals<DispatchResult<SyncObject>, { doubled: number }>>();
expectType<Equals<DispatchResult<SyncVoid>, void>>();
expectType<Equals<DispatchResult<SyncChild>, void | Promise<void>>>();
expectType<Equals<DispatchResult<SyncChildren>, void | Promise<void>>>();
expectType<Equals<DispatchResult<SyncChildOrData>, "skipped" | void | Promise<void>>>();

expectType<Equals<DispatchResult<AsyncNumber>, Promise<number>>>();
expectType<Equals<DispatchResult<AsyncVoid>, Promise<void>>>();
expectType<Equals<DispatchResult<AsyncChildren>, Promise<void>>>();
expectType<Equals<DispatchResult<AsyncChildOrData>, Promise<"skipped" | void>>>();

expectType<Equals<DispatchResult<AnyResult>, any>>();
expectType<Equals<DispatchResult<InheritsResult>, number>>();
expectType<Equals<DispatchResult<Returns<string>>, string>>();
expectType<Equals<DispatchResult<ReturnsAsync<string>>, Promise<string>>>();
expectType<Equals<DispatchResult<LegacySignature>, void | Promise<void> | Promise<unknown>>>();

// what callers see: T is inferred from the command argument
declare const dispatcher: Dispatcher<CardGameRoom>;

const syncResult = dispatcher.dispatch(new SyncNumber(), 2);
expectType<Equals<typeof syncResult, number>>();

const asyncResult = dispatcher.dispatch(new AsyncNumber());
expectType<Equals<typeof asyncResult, Promise<number>>>();

async function awaited() {
  const value = await dispatcher.dispatch(new AsyncChildOrData(), false);
  expectType<Equals<typeof value, "skipped" | void>>();
}

// @ts-expect-error payload type still checked
dispatcher.dispatch(new SyncNumber(), "2");
