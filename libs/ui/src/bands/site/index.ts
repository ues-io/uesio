import { createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

type SiteState = {
	name: string
	app: string
	domain: string
	subdomain: string
	version: string
}

const siteSlice = createSlice({
	name: "site",
	initialState: {} as SiteState,
	reducers: {},
})

const useSite = () => useSelector((state: RootState) => state.site)

export default siteSlice.reducer

export { useSite, SiteState }
