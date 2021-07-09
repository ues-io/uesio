import { createSlice } from "@reduxjs/toolkit"
import { SiteState } from "../../store/store"

const siteSlice = createSlice({
	name: "site",
	initialState: {} as SiteState,
	reducers: {},
})

export default siteSlice.reducer
