import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { RouteState } from "./types"

const useRoute = (): RouteState =>
	useSelector((state: RuntimeState) => state.route)

export { useRoute }
