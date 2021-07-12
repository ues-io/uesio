import { selectById } from "./adapter"
import { RootState } from "../../store/store"
import { useSelector } from "react-redux"

export const getComponentVariantById = (id: string): any =>
	useSelector((state: RootState) => selectById(state, id))
