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
}

export class NextTurnCommand extends Command<CardGameState> {
  execute() {
    const sessionIds = Object.keys(this.state.players);
    this.state.currentTurn = (this.state.currentTurn)
      ? sessionIds[(sessionIds.indexOf(this.state.currentTurn) + 1) % sessionIds.length]
      : sessionIds[0];
  }
}

export class DiscardCommand extends Command<CardGameState, number> {

  validate(client) {
    const player = this.state.players.get(client.sessionId);
    return player && player.cards[this.payload] !== undefined;
  }

  execute(client) {
    this.state.players.get(client.sessionId).cards.splice(this.payload, 1);
  }
}

export class DrawCommand extends Command<CardGameState> {

  execute(client) {
    this.state.players.get(client.sessionId).cards.push(new Card());
  }

}
