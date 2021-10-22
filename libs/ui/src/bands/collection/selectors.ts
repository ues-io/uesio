import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useCollection = (collectionId: string | undefined) =>
	useSelector((state: RootState) =>
		collectionId ? selectors.selectById(state, collectionId) : undefined
	)

export { useCollection }
