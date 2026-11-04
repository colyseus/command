import { Command } from "../../src";
import { CardGameRoom } from "./CardGameScenario";

export class Returns<T> extends Command<CardGameRoom> {
  constructor(private value: T) { super(); }

  execute() {
    return this.value;
  }
}

export class ReturnsAsync<T> extends Command<CardGameRoom> {
  constructor(private value: T) { super(); }

  async execute() {
    await this.delay(10);
    return this.value;
  }
}

export class ReturnsNothing extends Command<CardGameRoom> {
  execute() {}
}

export class ReturnsNothingAsync extends Command<CardGameRoom> {
  async execute() {
    await this.delay(10);
  }
}

export class Throws extends Command<CardGameRoom> {
  async execute() {
    await this.delay(10);
    throw new Error("async failure");
  }
}

/** Appends `entry` to `log`, so tests can assert what ran and in which order. */
export class Log extends Command<CardGameRoom, { log: string[], entry: string }> {
  execute({ log, entry } = this.payload) {
    log.push(entry);
    return `data from ${entry}`;
  }
}

export class LogAsync extends Command<CardGameRoom, { log: string[], entry: string }> {
  async execute({ log, entry } = this.payload) {
    await this.delay(10);
    log.push(entry);
    return `data from ${entry}`;
  }
}

export const log = (log: string[], entry: string) => new Log().setPayload({ log, entry });
export const logAsync = (log: string[], entry: string) => new LogAsync().setPayload({ log, entry });

/**
 * Looks like a Command without extending this copy's class, as happens when
 * the CJS and ESM builds are both loaded.
 */
export class ForeignCommand {
  ran = false;
  execute() {
    this.ran = true;
  }
}
