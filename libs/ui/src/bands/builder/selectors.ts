import { useSelector } from "react-redux"
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

const useNodeState = (path: string) =>
	useSelector(({ builder }: RootState) => {
		if (builder) {
			if (isMatch(path, builder.selectedNode)) {
				return "selected"
			}
			if (isMatch(path, builder.activeNode)) {
				return "active"
			}
		}
		return ""
	})

const useLastModifiedNode = () =>
	useSelector(({ builder }: RootState) => builder?.lastModifiedNode || "")

const useSelectedNode = () =>
	useSelector(({ builder }: RootState) => builder?.selectedNode || "")

const useDragNode = () =>
	useSelector(({ builder }: RootState) => builder?.draggingNode || "")

const useDropNode = () =>
	useSelector(({ builder }: RootState) => builder?.droppingNode || "")

const getMetadataListKey = (
	metadataType: MetadataType,
	namespace: string,
	grouping?: string
) => `${metadataType}-${namespace}-${grouping}`

const useMetadataList = (
	metadataType: MetadataType,
	namespace: string,
	grouping?: string
) => {
	const key = getMetadataListKey(metadataType, namespace, grouping)
	return useSelector(
		({ builder }: RootState) => builder?.metadata?.[key]?.data || null
	)
}

const useNamespaces = () =>
	useSelector(({ builder }: RootState) => builder?.namespaces?.data || null)

export {
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
	useDragNode,
	useDropNode,
	useMetadataList,
	useNamespaces,
	getMetadataListKey,
}
