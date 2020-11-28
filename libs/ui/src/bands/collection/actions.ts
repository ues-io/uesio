import { createAction } from "@reduxjs/toolkit"
import { PlainCollectionMap } from "../../collection/collection"

import types from "./types"

const load = createAction<PlainCollectionMap>(types.LOAD)

export default {
	load,
}
