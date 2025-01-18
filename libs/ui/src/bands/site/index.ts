import { createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

type BundleDependencyDefMap = Record<string, BundleDependencyDef>

type BundleDependencyDef = {
  version: string
  dependencies?: BundleDependencyDefMap
}

type SiteState = {
  name: string
  app: string
  domain: string
  subdomain: string
  version: string
  dependencies: BundleDependencyDefMap
  title?: string
}

const siteSlice = createSlice({
  name: "site",
  initialState: {} as SiteState,
  reducers: {},
})

const useSite = () => useSelector((state: RootState) => state.site)

export default siteSlice.reducer
export type { SiteState, BundleDependencyDef, BundleDependencyDefMap }
export { useSite }
