import { IMutationActions } from "../../src/index";

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
}

export type Actions = "draw" | "discard";

function isValidAction(state: CardGameState) {
  return !state.isGameOver;
}

export const actions: IMutationActions<Actions, CardGameState> = {
  discard: (state, payload: { index: number }, client) => {
    if (!isValidAction(state)) {
      throw new Error("can't do this right now.");
    }

    const player = state.players.get(client.sessionId);

    if (!player) {
      throw new Error("player not found!");
    }

    if (!player.cards[payload.index]) {
      throw new Error("card not found!");
    }

    player.cards.splice(payload.index, 1);
  },

  draw: (state, payload, client) => {
    state.players.get(client.sessionId).cards.push(new Card());
  },

}