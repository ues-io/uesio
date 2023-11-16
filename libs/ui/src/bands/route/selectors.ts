import { useSelector } from "react-redux"
import { RootState, getCurrentState } from "../../store/store"

const useRoute = () => useSelector((state: RootState) => state.route)
const getRoute = () => getCurrentState().route

export { useRoute, getRoute }
