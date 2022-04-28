import { useSelector } from "react-redux"
import { getFullPathParts } from "../../component/path"
import { RootState } from "../../store/store"
import { useViewDef } from "../viewdef"
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

const useSelectedYAML = () =>
	useSelector((state: RootState) => {
		const [metadataType, metadataItem] = getFullPathParts(
			state.builder?.selectedNode || ""
		)

		console.log("TODO:", metadataType)

		return useViewDef(metadataItem)?.parsed
		/*
		if (metadataType === "viewdef") {
			const viewDef = viewSelectors.selectById(state, metadataItem)
			return viewDef?.yaml
		}

		if (metadataType === "componentvariant") {
			const componentVariant = componentVariantSelectors.selectById(
				state,
				metadataItem
			)
			return componentVariant?.yaml
		}

		return undefined
		*/
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
	useSelectedType,
	useSelectedItem,
	useSelectedYAML,
	useLastModifiedNode,
	useDragNode,
	useDropNode,
	useMetadataList,
	useNamespaces,
	getMetadataListKey,
}
