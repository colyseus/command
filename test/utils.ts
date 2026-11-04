import { CardGameRoom, CardGameState } from "./scenarios/CardGameScenario";

export function createRoom() {
  const room = new CardGameRoom();
  room.setState(new CardGameState());
  // the matchmaker starts the clock on real rooms; `delay()` needs it ticking
  room.clock.start(true);
  return room;
}

export function disposeRoom(room: CardGameRoom) {
  room.clock.clear();
  room.clock.stop();
}
