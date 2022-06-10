import { useSelector } from "react-redux"
import { getFullPathParts } from "../../component/path"
import { RootState } from "../../store/store"
import { MetadataType } from "./types"

const isMatch = (componentPath: string, testPath?: string) => {
	if (testPath) {
		if (testPath === componentPath) {
			return true
		}
		if (testPath.startsWith(componentPath)) {
			const suffix = testPath.substring(componentPath.length)
			if (!suffix.includes(".")) {
				return true
			}
		}
	}
	return false
}

const useNodeState = (
	metadataType: string,
	metadataItem: string | undefined,
	path: string
) =>
	useSelector(({ builder }: RootState) => {
		const fullPath = `["${metadataType}"]["${metadataItem}"]${path}`
		if (builder) {
			if (isMatch(fullPath, builder.selectedNode)) {
				return "selected"
			}
			if (isMatch(fullPath, builder.activeNode)) {
				return "active"
			}
		}
		return ""
	})

const useLastModifiedNode = () =>
	useSelector(({ builder }: RootState) => builder?.lastModifiedNode || "")

const useSelectedNode = () =>
	useSelector(({ builder }: RootState) => builder?.selectedNode || "")

const useSelectedType = () =>
	useSelector(({ builder }: RootState) => {
		const [metadataType] = getFullPathParts(builder?.selectedNode || "")
		return metadataType
	})

const useSelectedItem = () =>
	useSelector(({ builder }: RootState) => {
		const [, metadataItem] = getFullPathParts(builder?.selectedNode || "")
		return metadataItem
	})

const useDragNode = () =>
	useSelector(({ builder }: RootState) => builder?.draggingNode || "")

const useDropNode = () =>
	useSelector(({ builder }: RootState) => builder?.droppingNode || "")

const getMetadataListKey = (
	metadataType: MetadataType,
	namespace: string,
	grouping?: string
) => `${metadataType}-${namespace}-${grouping}`

export {
	useNodeState,
	useSelectedNode,
	useSelectedType,
	useSelectedItem,
	useLastModifiedNode,
	useDragNode,
	useDropNode,
	getMetadataListKey,
}
