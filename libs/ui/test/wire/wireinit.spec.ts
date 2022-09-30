import { platform } from "../../src/platform/platform"
import { create } from "../../src/store/store"
import initializeWiresOp from "../../src/bands/wire/operations/initialize"
import { newContext } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"

// This is a somewhat trivial test to make sure UI only wires are
// initialized correctly. It mostly tests our ability to create a
// new store and dispatch actions/thunks against it
test("wire init", () => {
	const store = create(platform, {})
	const VIEW_NAME = "myview"
	const WIRE_NAME = "mywire"
	const context = newContext({ view: VIEW_NAME })
	store.dispatch(
		initializeWiresOp(context, {
			[WIRE_NAME]: {
				viewOnly: true,
				fields: {},
			},
		})
	)
	const myWire = selectWire(store.getState(), VIEW_NAME, WIRE_NAME)
	if (!myWire) throw new Error("Wire not created")

	expect(myWire.view).toStrictEqual(VIEW_NAME)
	expect(myWire.name).toStrictEqual(WIRE_NAME)
})
