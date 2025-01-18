import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
  {
    name: "mark single record for deletion",
    wireId,
    wireDef: { collection: collectionId, fields: {} },
    signals: [
      {
        signal: "wire/CREATE_RECORD",
        wire: wireId,
      },
      {
        signal: "wire/MARK_FOR_DELETE",
      },
    ],
    run: () => (wire) => {
      expect(Object.keys(wire.deletes)).toHaveLength(1)
    },
  },
  {
    name: "mark single record for deletion - wire explicitly specified",
    wireId,
    wireDef: { collection: collectionId, fields: {} },
    signals: [
      {
        signal: "wire/CREATE_RECORD",
        wire: wireId,
      },
      {
        signal: "wire/MARK_FOR_DELETE",
        wire: wireId,
      },
    ],
    run: () => (wire) => {
      expect(Object.keys(wire.deletes)).toHaveLength(1)
    },
  },
]

describe("wire/MARK_FOR_DELETE", () => {
  tests.map((el) => test(el.name, () => testWireSignal(el)))
})
