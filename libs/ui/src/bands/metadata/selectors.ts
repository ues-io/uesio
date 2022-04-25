import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useMetadataItem = (type: string, key: string) =>
	useSelector((state: RootState) =>
		selectors.selectById(state, `${type}:${key}`)
	)

const useMetadataKeys = (type: string) =>
	useSelector((state: RootState) =>
		selectors
			.selectIds(state)
			.filter((id: string) => id.startsWith(type))
			.map((id: string) => id.split(":")[1])
	)

export { useMetadataItem, useMetadataKeys }
