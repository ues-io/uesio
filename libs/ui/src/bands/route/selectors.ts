import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"

const useRoute = () => useSelector((state: RuntimeState) => state.route)

export { useRoute }
