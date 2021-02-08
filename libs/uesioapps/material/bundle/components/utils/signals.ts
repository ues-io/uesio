import { context, signal } from "@uesio/ui"

const sigHandler = <S>(makePayload: (state: S) => S) => ({
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: S) => void,
			getState: () => S
		) => {
			setState(makePayload(getState()))
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
})

export default sigHandler
