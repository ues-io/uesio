import { metadata } from "@uesio/constants"
import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"

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

const useBuilderNodeState = (path: string) =>
	useSelector(({ builder }: RuntimeState) => {
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

const useBuilderSelectedNode = () =>
	useSelector(({ builder }: RuntimeState) => builder?.selectedNode || "")

const useBuilderDragNode = () =>
	useSelector(({ builder }: RuntimeState) => builder?.draggingNode || "")

const useBuilderDropNode = () =>
	useSelector(({ builder }: RuntimeState) => builder?.droppingNode || "")

const useBuilderLeftPanel = () =>
	useSelector(({ builder }: RuntimeState) => builder?.leftPanel || "")

const useBuilderRightPanel = () =>
	useSelector(({ builder }: RuntimeState) => builder?.rightPanel || "")

const useBuilderView = () =>
	useSelector(({ builder }: RuntimeState) => builder?.buildView || "")

const useBuilderMode = () =>
	useSelector(({ builder }: RuntimeState) =>
		builder ? !!builder.buildMode : false
	)

const useBuilderMetadataList = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
) =>
	grouping
		? useSelector(
				({ builder }: RuntimeState) =>
					builder?.metadata?.[metadataType]?.[namespace]?.[
						grouping
					] || null
		  )
		: useSelector(
				({ builder }: RuntimeState) =>
					builder?.metadata?.[metadataType]?.[namespace] || null
		  )

const useBuilderAvailableNamespaces = () =>
	useSelector(({ builder }: RuntimeState) => builder?.namespaces || null)

export {
	useBuilderNodeState,
	useBuilderSelectedNode,
	useBuilderMode,
	useBuilderDragNode,
	useBuilderDropNode,
	useBuilderLeftPanel,
	useBuilderRightPanel,
	useBuilderView,
	useBuilderMetadataList,
	useBuilderAvailableNamespaces,
}
