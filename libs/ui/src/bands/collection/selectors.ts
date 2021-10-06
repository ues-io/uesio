import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useCollection = (collectionId: string) =>
	useSelector((state: RootState) => selectors.selectById(state, collectionId))

export { useCollection }
