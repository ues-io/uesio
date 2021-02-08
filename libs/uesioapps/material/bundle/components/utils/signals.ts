import { context, signal } from "@uesio/ui"

type Payload<S> = (state: S) => S

const sigHandler = <S>(payload: Payload<S>) => ({
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
