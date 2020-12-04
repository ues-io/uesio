import { metadata } from "@uesio/constants"
import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { MetadataListStore } from "./types"

const isMatch = (componentPath: string, testPath?: string): boolean => {
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

const useBuilderNodeState = (path: string): string =>
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

const useBuilderSelectedNode = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.selectedNode || "")

const useBuilderDragNode = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.draggingNode || "")

const useBuilderDropNode = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.droppingNode || "")

const useBuilderLeftPanel = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.leftPanel || "")

const useBuilderRightPanel = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.rightPanel || "")

const useBuilderView = (): string =>
	useSelector(({ builder }: RuntimeState) => builder?.buildView || "")

const useBuilderMode = (): boolean =>
	useSelector(({ builder }: RuntimeState) =>
		builder ? !!builder.buildMode : false
	)

const useBuilderMetadataList = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
): MetadataListStore =>
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

const useBuilderAvailableNamespaces = (): MetadataListStore =>
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
