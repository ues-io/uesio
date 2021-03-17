import { metadata } from "@uesio/constants"
import { useSelector } from "react-redux"
import { RootState } from "../../store/store"

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

const useMetadataList = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
) =>
	grouping
		? useSelector(
				({ builder }: RootState) =>
					builder?.metadata?.[metadataType]?.[namespace]?.[
						grouping
					] || null
		  )
		: useSelector(
				({ builder }: RootState) =>
					builder?.metadata?.[metadataType]?.[namespace] || null
		  )

const useNamespaces = () =>
	useSelector(({ builder }: RootState) => builder?.namespaces || null)

export {
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
	useDragNode,
	useDropNode,
	useMetadataList,
	useNamespaces,
}
