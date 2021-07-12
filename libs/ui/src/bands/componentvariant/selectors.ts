import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
// import { ComponentVariant } from "./types"
import { selectors } from "./"

// Both gets component state and subscribes to component changes
export const useComponentVariant = (id: string) =>
	useSelector((state: RootState) => selectors.selectById(state, id))
