import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

const useTheme = () => useSelector((state: RootState) => state.theme)

export { useTheme }
