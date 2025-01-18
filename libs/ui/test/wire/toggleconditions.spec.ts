import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
  {
    name: "toggling from undefined",
    wireId,
    wireDef: {
      collection: collectionId,
      conditions: [
        {
          id: "123",
          field: "ben/planets.name",
          valueSource: "VALUE",
          value: "kepler",
        },
      ],
      fields: {},
    },
    signals: [
      {
        signal: "wire/TOGGLE_CONDITION",
        wire: wireId,
        conditionId: "123",
      },
    ],
    run: () => (wire) =>
      expect(wire).toMatchObject({
        conditions: [
          {
            id: "123",
            field: "ben/planets.name",
            valueSource: "VALUE",
            value: "kepler",
          },
        ],
      }),
  },
  {
    name: "toggling from false",
    wireId,
    wireDef: {
      collection: collectionId,
      conditions: [
        {
          id: "123",
          field: "ben/planets.name",
          valueSource: "VALUE",
          value: "kepler",
          inactive: true,
        },
      ],
      fields: {},
    },
    signals: [
      {
        signal: "wire/TOGGLE_CONDITION",
        wire: wireId,
        conditionId: "123",
      },
    ],
    run: () => (wire) =>
      expect(wire).toMatchObject({
        conditions: [
          {
            id: "123",
            field: "ben/planets.name",
            valueSource: "VALUE",
            value: "kepler",
            inactive: false,
          },
        ],
      }),
  },
  {
    name: "toggling from true",
    wireId,
    wireDef: {
      collection: collectionId,
      conditions: [
        {
          id: "123",
          field: "ben/planets.name",
          valueSource: "VALUE",
          value: "kepler",
          inactive: false,
        },
      ],
      fields: {},
    },
    signals: [
      {
        signal: "wire/TOGGLE_CONDITION",
        wire: wireId,
        conditionId: "123",
      },
    ],
    run: () => (wire) =>
      expect(wire).toMatchObject({
        conditions: [
          {
            id: "123",
            field: "ben/planets.name",
            valueSource: "VALUE",
            value: "kepler",
          },
        ],
      }),
  },
  {
    name: "toggling nonexistent condition",
    wireId,
    wireDef: {
      collection: collectionId,
      conditions: [
        {
          id: "000",
          field: "ben/planets.name",
          valueSource: "VALUE",
          value: "kepler",
        },
      ],
      fields: {},
    },
    signals: [
      {
        signal: "wire/TOGGLE_CONDITION",
        wire: wireId,
        conditionId: "123",
      },
    ],
    run: () => (wire) =>
      expect(wire.conditions).toEqual([
        {
          id: "000",
          field: "ben/planets.name",
          valueSource: "VALUE",
          value: "kepler",
        },
      ]),
  },
]

describe("signals: wire/TOGGLE_CONDITION", () => {
  tests.map((el) => test(el.name, () => testWireSignal(el)))
})
