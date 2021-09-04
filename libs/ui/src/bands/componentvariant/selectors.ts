import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectEntities } from "./adapter"

const useAllVariants = () =>
	useSelector((state: RootState) => selectEntities(state))

export { useAllVariants }
