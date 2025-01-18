import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
  {
    name: "Update record",
    wireId,
    wireDef: { collection: collectionId, fields: {} },
    signals: [
      {
        signal: "wire/CREATE_RECORD",
        wire: wireId,
      },
      {
        signal: "wire/UPDATE_RECORD",
        wire: wireId,
        field: "ben/planets.name",
        value: "Kepler-16b",
      },
      {
        signal: "wire/CANCEL",
        wire: wireId,
      },
    ],
    run: () => (wire) => {
      const records = Object.values(wire.data)
      expect(records).toHaveLength(0)
    },
  },
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
