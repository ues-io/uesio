import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"

const useTheme = () => useSelector((state: RuntimeState) => state.theme)

export { useTheme }
