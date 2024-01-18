import { useSelector } from "react-redux"
import { RootState, getCurrentState } from "../../store/store"
import { RouteState } from "./types"

const hasRouteNavigated = (a: RouteState, b: RouteState) =>
	a.view === b.view && a.path === b.path && a.params === b.params

const useRouteLoading = () =>
	useSelector((state: RootState) => state.route?.isLoading)
const useRoute = () =>
	useSelector((state: RootState) => state.route, hasRouteNavigated)
const getRoute = () => getCurrentState().route

export { useRoute, getRoute, useRouteLoading }
