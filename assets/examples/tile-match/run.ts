import { CocosAdapter } from "../../adapters/cocos/index.js";
import { MessageRuntime } from "../../foundation-core/index.js";
import { SaveCoordinator, serializeSnapshot } from "../../save/index.js";
import { FeatureRuntime } from "../../runtime/index.js";
import { TileMatchFeature, TileMatchSession, type TileState } from "./tileMatch.js";

const messages = new MessageRuntime();
const created = TileMatchSession.create({
  width: 3,
  height: 3,
  tiles: ["A", "B", "A", "C", "A", "C", "B", "A", "B"],
}, messages);
if (!created.ok) throw new Error(created.error.message);
const session = created.value;
const save = new SaveCoordinator("2.0.0");
const runtime = new FeatureRuntime();
runtime.capabilities.provide("framework.save", save);
runtime.add(new TileMatchFeature(session));
const activated = runtime.activate();
if (!activated.ok) throw new Error(activated.error.code);
const renders: TileState[] = [];
let inputHandler: ((intent: { from: number; to: number }) => void) | undefined;
const adapter = new CocosAdapter({
  input: { subscribe: (handler) => { inputHandler = handler; return () => { inputHandler = undefined; }; } },
  presentation: { render: (state) => renders.push(state) },
  dispatchIntent: (intent) => { messages.execute({ type: "tile.swap", payload: intent }); },
  read: () => session.read(),
});
adapter.boot();
inputHandler?.({ from: 1, to: 4 });
const snapshot = save.capture();
if (!snapshot.ok) throw new Error(snapshot.error.code);
session.restore({ tiles: Array(9).fill("C"), score: 0 });
save.restore(snapshot.value);
adapter.update(1 / 60);
adapter.shutdown();
runtime.deactivate();
console.log(serializeSnapshot(snapshot.value));
console.log(JSON.stringify({ restored: session.read(), renders: renders.length, shutdown: inputHandler === undefined }));
