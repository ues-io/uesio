import { context, signal } from "@uesio/ui"

const sigHandler = <S>(payload: (state: S) => S) => ({
	TOGGLE_MODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: S) => void,
			getState: () => S
		) => {
			setState(payload(getState()))
			return ctx
		},
		label: "Toggle Mode",
		properties: () => [],
	},
})

export default sigHandler
