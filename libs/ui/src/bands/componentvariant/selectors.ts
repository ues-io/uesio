import { selectById } from "./adapter"
import { RootState } from "../../store/store"
import { useSelector } from "react-redux"

export const getComponentVariantById = (id: string) =>
	useSelector((state: RootState) => selectById(state, id))
