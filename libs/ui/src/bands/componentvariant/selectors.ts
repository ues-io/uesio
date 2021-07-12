import { selectById } from "./adapter"
import { RootState } from "../../store/store"
import { useSelector } from "react-redux"

export const useComponentVariant = (
	componentType: string,
	variantName: string
) =>
	useSelector((state: RootState) =>
		selectById(state, `${componentType}.${variantName}`)
	)
