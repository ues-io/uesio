import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { ThemeState } from "./types"

const useTheme = (): ThemeState | undefined =>
	useSelector((state: RuntimeState) => state?.theme)

export { useTheme }
