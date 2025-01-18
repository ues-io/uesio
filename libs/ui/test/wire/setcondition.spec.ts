import testWireSignal, { WireSignalTest, getDefaultContext } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
  {
    name: "happy path",
    wireId,
    wireDef: { collection: collectionId, fields: {} },
    signals: [
      {
        signal: "wire/SET_CONDITION",
        wire: wireId,
        condition: {
          id: "123",
        },
      },
    ],
    run: () => (wire) => () => {
      expect(wire).toMatchObject({
        conditions: [{ id: "123" }],
      })
    },
  },
  {
    name: "all inputs are merge strings",
    context: getDefaultContext().addSignalOutputFrame("step1", {
      wireName: wireId,
      conditionName: "456",
    }),
    wireId,
    wireDef: { collection: collectionId, fields: {} },
    signals: [
      {
        signal: "wire/SET_CONDITION",
        wire: `$SignalOutput{step1:wireName}`,
        condition: {
          id: `$SignalOutput{step1:conditionName}`,
        },
      },
    ],
    run: () => (wire) => () => {
      expect(wire).toMatchObject({
        conditions: [{ id: "456" }],
      })
    },
  },
]

describe("signals: wire/SET_CONDITION", () => {
  tests.map((el) => test(el.name, () => testWireSignal(el)))
})
