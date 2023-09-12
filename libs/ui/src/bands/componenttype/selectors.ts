import { getCurrentState } from "../../store/store"
import { selectors } from "./adapter"

const getComponentType = (componentType: string) =>
	selectors.selectById(getCurrentState(), componentType)

const getAllComponentTypes = () => selectors.selectAll(getCurrentState())

export { getAllComponentTypes, getComponentType }
