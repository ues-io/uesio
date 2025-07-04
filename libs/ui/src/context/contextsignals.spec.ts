import { runMany } from "../signals/signals"
import { Context } from "./context"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`

const viewContext = new Context().addViewFrame({
  params: { foo: "bar" },
  view: viewName,
  viewDef,
})

const testCases = [
  {
    name: "sanity",
    initialContext: new Context(),
    signals: [],
    expectedContext: new Context(),
  },
  {
    name: "sanity - with view context",
    initialContext: viewContext,
    signals: [],
    expectedContext: viewContext,
  },
  {
    name: "clear view context - no viewdef specified",
    initialContext: viewContext,
    signals: [
      {
        signal: "context/CLEAR",
        type: "VIEW",
      },
    ],
    expectedContext: new Context(),
  },
  {
    name: "clear view context - with viewDef specified",
    initialContext: viewContext,
    signals: [
      {
        signal: "context/CLEAR",
        type: "VIEW",
        viewDef,
      },
    ],
    expectedContext: new Context(),
  },
  {
    // This should not make any changes to the context because the view
    // defs do not match.
    name: "clear view context - with different viewDef specified",
    initialContext: viewContext,
    signals: [
      {
        signal: "context/CLEAR",
        type: "VIEW",
        viewDef: "uesio/core.foo2",
      },
    ],
    expectedContext: viewContext,
  },
]

describe("testContextSignal", () => {
  testCases.forEach((tc) => {
    test(tc.name, async () => {
      const finalContext = await runMany(tc.signals, tc.initialContext)
      expect(finalContext.stack).toMatchObject(tc.expectedContext.stack)
    })
  })
})
