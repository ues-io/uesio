import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

const useRoute = () => useSelector((state: RootState) => state.route)

export { useRoute }
