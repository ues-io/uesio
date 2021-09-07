import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectEntities, selectById } from "./adapter"

const useAllVariants = () =>
	useSelector((state: RootState) => selectEntities(state))

const useVariant = (variantId: string) =>
	useSelector((state: RootState) => selectById(state, variantId))

export { useAllVariants, useVariant }
