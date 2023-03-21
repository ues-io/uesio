import { signal } from "@uesio/ui"

type DisabledState = {
	disabled?: boolean
}

const disable: signal.ComponentSignalDescriptor<DisabledState> = {
	dispatcher: (state) => {
		state.disabled = true
	},
}
const enable: signal.ComponentSignalDescriptor<DisabledState> = {
	dispatcher: (state) => {
		state.disabled = false
	},
}

export { disable, enable }
