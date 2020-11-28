import { createReducer } from "@reduxjs/toolkit"
import { PlainCollectionMap } from "../../collection/collection"

import actions from "./actions"

export default createReducer<PlainCollectionMap>({}, (builder) => {
	builder.addCase(actions.load, (state, { payload }) => ({
		...state,
		...payload,
	}))
})
