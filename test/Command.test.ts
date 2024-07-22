import assert from "assert";

import { Dispatcher } from "../src";
import { CardGameState, Player, Card, DiscardCommand, DrawCommand, EnqueueCommand, EnqueueAsyncCommand, AsyncSequence, DeepAsync, DeepSync, CardGameRoom, ValidationCommand } from "./scenarios/CardGameScenario";
import { Client } from "./mock/colyseus";

describe("@colyseus/action", () => {
  let room: CardGameRoom;

  beforeEach(() => {
    room = new CardGameRoom();
    room.setState(new CardGameState());
  });

  it("should validate if command can be executed", () => {
    const dispatcher = new Dispatcher(room);

    let error: string | undefined;
    try {
      dispatcher.dispatch(new ValidationCommand(), 1);
    } catch (e: any) {
      error = e.message;
    }

    assert.strictEqual('This should never execute!', error);
  });

  it("should reject if command can't be validated", async () => {
    let error: string | undefined;

    const dispatcher = new Dispatcher(room);
    try {
      await dispatcher.dispatch(new ValidationCommand(), 10);
    } catch (e: any) {
      error = e.message;
    }

    assert.strictEqual('ValidationCommand: invalid -> (10)', error);
  });

  it("should perform discard a card", () => {
    const client1 = new Client();
    const player1 = new Player();
    player1.cards.push(new Card());
    player1.cards.push(new Card());
    player1.cards.push(new Card());
    room.state.players.set(client1.sessionId, player1);

    const client2 = new Client();
    const player2 = new Player();
    player2.cards.push(new Card());
    player2.cards.push(new Card());
    player2.cards.push(new Card());
    room.state.players.set(client2.sessionId, player2);

    assert.strictEqual(3, player1.cards.length);

    const dispatcher = new Dispatcher(room);
    dispatcher.dispatch(new DiscardCommand(), { sessionId: client1.sessionId, index: 2 });

    assert.strictEqual(2, player1.cards.length);
  });

  it("should perform draw a card", () => {
    const client1 = new Client();
    const player1 = new Player();
    player1.cards.push(new Card());
    player1.cards.push(new Card());
    player1.cards.push(new Card());
    room.state.players.set(client1.sessionId, player1);

    const client2 = new Client();
    const player2 = new Player();
    player2.cards.push(new Card());
    player2.cards.push(new Card());
    player2.cards.push(new Card());
    room.state.players.set(client2.sessionId, player2);

    assert.strictEqual(3, player1.cards.length);

    const dispatcher = new Dispatcher(room);
    dispatcher.dispatch(new DrawCommand(), { sessionId: client1.sessionId });

    assert.strictEqual(4, player1.cards.length);
  });

  it("should enqueue returned commands", () => {
    const dispatcher = new Dispatcher(room);
    dispatcher.dispatch(new EnqueueCommand(), { count: 5 });
    assert.strictEqual(25, room.state.i);
  });

  it("should enqueue async commands", async () => {
    const dispatcher = new Dispatcher(room);
    await dispatcher.dispatch(new EnqueueAsyncCommand(), { count: 5 });
    assert.strictEqual(25, room.state.i);
  });

  it("should dequeue async commands in sequence", async () => {
    const dispatcher = new Dispatcher(room);

    const time = Date.now();
    await dispatcher.dispatch(new AsyncSequence());

    const elapsedTime = Date.now() - time;
    assert.ok(elapsedTime >= 300, `elapsed time is ${elapsedTime}, but should've been >= 300`);
  });

  it("should execute deep sync commands", () => {
    const dispatcher = new Dispatcher(room);
    dispatcher.dispatch(new DeepSync());
    assert.strictEqual(222, room.state.i);
  });

  it("should execute deep async commands", async () => {
    const dispatcher = new Dispatcher(room);
    await dispatcher.dispatch(new DeepAsync());
    assert.strictEqual(222, room.state.i);
  });

});
