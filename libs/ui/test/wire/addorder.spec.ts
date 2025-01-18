import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
  {
    name: "Add order false",
    wireId,
    wireDef: {
      collection: collectionId,
      // Todo, do we need a field?
      fields: { "ben/planets.name": null },
    },
    signals: [
      {
        signal: "wire/ADD_ORDER",
        wire: wireId,
        field: "ben/planets.name",
        desc: false,
      },
    ],
    run: () => (wire) => {
      expect(wire.order).toEqual([{ field: "ben/planets.name", desc: false }])
    },
  },
  {
    name: "Add order true",
    wireId,
    wireDef: {
      collection: collectionId,
      fields: { "ben/planets.name": null },
    },
    signals: [
      {
        signal: "wire/ADD_ORDER",
        wire: wireId,
        field: "ben/planets.name",
        desc: true,
      },
    ],
    run: () => (wire) => {
      expect(wire.order).toEqual([{ field: "ben/planets.name", desc: true }])
    },
  },
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
