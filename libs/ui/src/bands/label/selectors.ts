import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectEntities, selectors } from "./adapter"
import { Label } from "./types"
const useAllLabels = () =>
	useSelector((state: RootState) => selectEntities(state))

const getLabel = (state: RootState, labelId: string): Label | undefined => {
	const label = selectors.selectById(state, labelId)
	return label
}

export { useAllLabels, getLabel }
