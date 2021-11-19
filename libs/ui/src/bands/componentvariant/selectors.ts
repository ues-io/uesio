import { get } from "lodash"
import { useSelector } from "react-redux"
import { Definition } from "../../definition/definition"
import { RootState } from "../../store/store"
import { selectEntities, selectors } from "./adapter"

const useAllVariants = () =>
	useSelector((state: RootState) => selectEntities(state))

const getComponentVariant = (
	state: RootState,
	componentVariantDef: string,
	path?: string
): Definition => {
	const ComponentVariant = selectors.selectById(state, componentVariantDef)
	const definition = ComponentVariant?.definition
	return path ? get(definition, path || "") : definition
}

export { useAllVariants, getComponentVariant }
