import { signal, context } from "@uesio/ui"

type ModeState = {
  mode?: context.FieldMode
}

const toggleMode: signal.ComponentSignalDescriptor<ModeState> = {
  dispatcher: (state) => {
    state.mode = state.mode === "READ" || !state.mode ? "EDIT" : "READ"
  },
}
const setReadMode: signal.ComponentSignalDescriptor<ModeState> = {
  dispatcher: (state) => {
    state.mode = "READ"
  },
}
const setEditMode: signal.ComponentSignalDescriptor<ModeState> = {
  dispatcher: (state) => {
    state.mode = "EDIT"
  },
}

export { toggleMode, setEditMode, setReadMode }
