import assert from "assert";

import { Dispatcher } from "../src";
import { CardGameState, Actions, actions, Player, Card } from "./scenarios/CardGameScenario";
import { Room, Client } from "./mock/colyseus";

describe("@colyseus/action", () => {
  let room: Room<CardGameState>;

  beforeEach(() => {
    room = new Room<CardGameState>();
    room.setState(new CardGameState());
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

    assert.equal(3, player1.cards.length);

    const dispatcher = new Dispatcher<Actions>(room);
    dispatcher.register(actions);
    dispatcher.dispatch("discard", { index: 2 }, client1);

    assert.equal(2, player1.cards.length);
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

    assert.equal(3, player1.cards.length);

    const dispatcher = new Dispatcher<Actions>(room);
    dispatcher.register(actions);
    dispatcher.dispatch("draw", {}, client1);

    assert.equal(4, player1.cards.length);
  });

});