import assert from "assert";
import { schema, t } from "@colyseus/schema";

import { Command, Dispatcher } from "../src";
import { CardGameRoom, ValidationCommand } from "./scenarios/CardGameScenario";
import { ForeignCommand, Returns, ReturnsAsync, ReturnsNothing, ReturnsNothingAsync, Throws, log, logAsync } from "./scenarios/ReturnValueScenario";
import { createRoom, disposeRoom } from "./utils";

// falsy values are listed apart: the old dispatcher treated them as "no children"
const VALUES: Array<[string, unknown]> = [
  ["number", 42],
  ["string", "text"],
  ["true", true],
  ["object", { doubled: 4 }],
  ["array without commands", [1, 2, 3]],
  ["empty array", []],
  ["Map", new Map([["a", 1]])],
  ["Schema instance", new (schema({ id: t.string() }))()], // #9
];
const FALSY_VALUES: Array<[string, unknown]> = [
  ["0", 0],
  ["empty string", ""],
  ["false", false],
  ["null", null],
];

describe("return values", () => {
  let room: CardGameRoom;
  let dispatcher: Dispatcher<CardGameRoom>;

  beforeEach(() => {
    room = createRoom();
    dispatcher = new Dispatcher(room);
  });
  afterEach(() => disposeRoom(room));

  describe("sync execute()", () => {
    for (const [name, value] of [...VALUES, ...FALSY_VALUES]) {
      it(`returns ${name} as-is`, () => {
        assert.strictEqual(dispatcher.dispatch(new Returns(value)), value);
      });
    }

    it("returns undefined when execute() returns nothing", () => {
      assert.strictEqual(dispatcher.dispatch(new ReturnsNothing()), undefined);
    });

    it("throws when execute() throws", () => {
      assert.throws(() => dispatcher.dispatch(new ValidationCommand(), 1), /This should never execute!/);
    });
  });

  describe("async execute()", () => {
    for (const [name, value] of [...VALUES, ...FALSY_VALUES]) {
      it(`resolves ${name} as-is`, async () => {
        const result = dispatcher.dispatch(new ReturnsAsync(value));
        assert.ok(result instanceof Promise);
        assert.strictEqual(await result, value);
      });
    }

    it("resolves undefined when execute() returns nothing", async () => {
      const result = dispatcher.dispatch(new ReturnsNothingAsync());
      assert.ok(result instanceof Promise);
      assert.strictEqual(await result, undefined);
    });

    it("rejects when execute() throws", async () => {
      await assert.rejects(dispatcher.dispatch(new Throws()), /async failure/);
    });
  });

  describe("returning commands", () => {
    it("dispatches a single returned command", () => {
      const entries: string[] = [];
      const result = dispatcher.dispatch(new Returns(log(entries, "child")));

      assert.deepStrictEqual(entries, ["child"]);
      assert.strictEqual(result, undefined);
    });

    it("dispatches returned commands in order", () => {
      const entries: string[] = [];
      const result = dispatcher.dispatch(new Returns([log(entries, "a"), log(entries, "b"), log(entries, "c")]));

      assert.deepStrictEqual(entries, ["a", "b", "c"]);
      assert.strictEqual(result, undefined);
    });

    it("dispatches commands resolved by async execute()", async () => {
      const entries: string[] = [];
      const result = await dispatcher.dispatch(new ReturnsAsync([logAsync(entries, "a"), log(entries, "b")]));

      assert.deepStrictEqual(entries, ["a", "b"]);
      assert.strictEqual(result, undefined);
    });

    it("waits for async children of a sync command, in order", async () => {
      const entries: string[] = [];
      const result = dispatcher.dispatch(new Returns([log(entries, "a"), logAsync(entries, "b"), log(entries, "c")]));

      assert.ok(result instanceof Promise);
      assert.deepStrictEqual(entries, ["a"]);
      assert.strictEqual(await result, undefined);
      assert.deepStrictEqual(entries, ["a", "b", "c"]);
    });

    it("dispatches commands nested in returned commands", () => {
      const entries: string[] = [];
      dispatcher.dispatch(new Returns([new Returns(log(entries, "deep")), log(entries, "shallow")]));

      assert.deepStrictEqual(entries, ["deep", "shallow"]);
    });

    it("dispatches commands that don't extend this copy of Command", () => {
      const foreign = new ForeignCommand();
      dispatcher.dispatch(new Returns(foreign as unknown as Command));

      assert.ok(foreign.ran);
    });

    it("throws on a non-command next to commands, instead of returning the array", () => {
      const entries: string[] = [];
      assert.throws(() => dispatcher.dispatch(new Returns([log(entries, "a"), 42])), TypeError);
      assert.deepStrictEqual(entries, ["a"]);
    });
  });

  describe("not executed", () => {
    it("returns undefined when the dispatcher is stopped", () => {
      dispatcher.stop();
      assert.strictEqual(dispatcher.dispatch(new Returns(42)), undefined);
    });

    it("returns undefined when validate() fails", () => {
      assert.strictEqual(dispatcher.dispatch(new ValidationCommand(), 10), undefined);
    });

    it("returns data again after resume()", () => {
      dispatcher.stop();
      dispatcher.resume();
      assert.strictEqual(dispatcher.dispatch(new Returns(42)), 42);
    });
  });
});
