import { Command } from "../../src/index";

export class Card {
  number: number;
  suit: string;
  played: boolean = false;
}

export class Player {
  cards: Card[] = [];
}

export class CardGameState {
  isGameOver: boolean = false;
  players = new Map<string, Player>();
  currentTurn: string;
  i: number;
}

export class NextTurnCommand extends Command<CardGameState, {}> {
  execute() {
    const sessionIds = Object.keys(this.state.players);
    this.state.currentTurn = (this.state.currentTurn)
      ? sessionIds[(sessionIds.indexOf(this.state.currentTurn) + 1) % sessionIds.length]
      : sessionIds[0];
  }
}

export class DiscardCommand extends Command<CardGameState, { sessionId: string, index: number }> {
  validate({ sessionId, index } = this.payload) {
    const player = this.state.players.get(sessionId);
    return player !== undefined && player.cards[index] !== undefined;
  }

  execute({ sessionId, index } = this.payload) {
    this.state.players.get(sessionId).cards.splice(index, 1);
  }
}

export class DrawCommand extends Command<CardGameState, { sessionId: string }> {
  execute({ sessionId }) {
    this.state.players.get(sessionId).cards.push(new Card());
  }
}

export class EnqueueCommand extends Command<CardGameState, { count: number }> {
  execute({ count }) {
    this.state.i = 0;

    return [...Array(count)].map(_ =>
      new ChildCommand().setPayload({ i: count }));
  }
}

export class ChildCommand extends Command<CardGameState, { i: number }> {
  execute({ i }) {
    this.state.i += i;
  }
}

export class EnqueueAsyncCommand extends Command<CardGameState, { count: number }> {
  async execute({ count }) {
    this.state.i = 0;

    return [...Array(count)].map(_ =>
      new ChildAsyncCommand().setPayload({ i: count }));
  }
}

export class ChildAsyncCommand extends Command<CardGameState, { i: number }> {
  async execute({ i }) {
    await new Promise((resolve) => {
      setTimeout(() => {
        this.state.i += i;
        resolve();
      }, 500)
    })
  }
}