import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useTheme = (themeId: string) =>
	useSelector((state: RootState) => selectors.selectById(state, themeId))

export { useTheme }
