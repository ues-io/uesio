import { createSlice } from "@reduxjs/toolkit"
import { SiteState } from "../../store/store"

const userSlice = createSlice({
	name: "site",
	initialState: {} as SiteState,
	reducers: {},
})

export default userSlice.reducer
