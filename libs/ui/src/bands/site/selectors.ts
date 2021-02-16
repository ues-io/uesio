import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

const useSite = () => useSelector((state: RootState) => state.site)

export { useSite }
