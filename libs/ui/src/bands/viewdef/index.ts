import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { parseKey } from "../../component/path"
import { PlainViewDefMap } from "../../viewdef/viewdef"

const viewDefSlice = createSlice({
	name: "viewdef",
	initialState: {} as PlainViewDefMap,
	reducers: {
		add: (state, { payload: viewDefId }: PayloadAction<string>) => {
			const [namespace, name] = parseKey(viewDefId)
			return {
				...state,
				[viewDefId]: {
					...state[viewDefId],
					name,
					namespace,
				},
			}
		},
	},
})

export const { add } = viewDefSlice.actions
export default viewDefSlice.reducer
