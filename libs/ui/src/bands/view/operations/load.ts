import { Context } from "../../../context/context"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { runMany } from "../../../signals/signals"
import { selectors as viewSelectors } from "../../viewdef"
import { ViewDefinition } from "../../../definition/viewdef"

import { ThunkFunc } from "../../../store/store"

export default (context: Context): ThunkFunc =>
	async (dispatch, getState) => {
		// First check to see if we have the viewDef
		const viewDefId = context.getViewDefId()
		if (!viewDefId) throw new Error("No View Def Context Provided")

		const viewDef = viewSelectors.selectById(getState(), viewDefId)

		// if (!viewDef) {
		// 	const [namespace, name] = parseKey(viewDefId)
		// 	const viewDefResponse = await api.getView(context, namespace, name)

		// 	const yamlDoc = parse(viewDefResponse)
		// 	//const definitionNode = getNodeAtPath("definition", yamlDoc.contents)
		// 	//const depsNode = getNodeAtPath("dependencies", yamlDoc.contents)
		// 	const defNode = getNodeAtPath("definition", yamlDoc.contents)
		// 	// removeNodeAtPath("dependencies", yamlDoc.contents)
		// 	const defDoc = newDoc()
		// 	defDoc.contents = defNode
		// 	const viewContent = defDoc?.toString()
		// 	const viewToAdd: MetadataState = {
		// 		key: viewDefId,
		// 		content: viewContent || "",
		// 		original: viewContent,
		// 		parsed: defNode?.toJSON(),
		// 	}

		// 	// const componentPacksToAdd: MetadataState[] = []
		// 	// const configValuesToAdd: MetadataState[] = []
		// 	// const labelsToAdd: MetadataState[] = []
		// 	// const componentVariantsToAdd: MetadataState[] = []

		// 	// if (depsNode) {
		// 	// 	const packsNode = getNodeAtPath("componentpacks", depsNode)
		// 	// 	if (packsNode) {
		// 	// 		const packs = packsNode.toJSON()
		// 	// 		Object.keys(packs).forEach((dep) => {
		// 	// 			componentPacksToAdd.push({
		// 	// 				key: dep,
		// 	// 				content: "",
		// 	// 				parsed: undefined,
		// 	// 			})
		// 	// 		})
		// 	// 	}
		// 	// 	const configNode = getNodeAtPath("configvalues", depsNode)
		// 	// 	if (configNode) {
		// 	// 		const configs = configNode.toJSON()
		// 	// 		Object.keys(configs).forEach((dep) => {
		// 	// 			const value = configs[dep]
		// 	// 			configValuesToAdd.push({
		// 	// 				key: dep,
		// 	// 				content: value || "",
		// 	// 				parsed: undefined,
		// 	// 			})
		// 	// 		})
		// 	// 	}
		// 	// 	const labelsNode = getNodeAtPath("labels", depsNode)
		// 	// 	if (labelsNode) {
		// 	// 		const labels = labelsNode.toJSON()
		// 	// 		Object.keys(labels).forEach((dep) => {
		// 	// 			const value = labels[dep]
		// 	// 			labelsToAdd.push({
		// 	// 				key: dep,
		// 	// 				content: value || "",
		// 	// 				parsed: undefined,
		// 	// 			})
		// 	// 		})
		// 	// 	}
		// 	// 	const variantsNode = getNodeAtPath(
		// 	// 		"componentvariants",
		// 	// 		depsNode
		// 	// 	)
		// 	// 	if (variantsNode) {
		// 	// 		const variants = variantsNode.toJSON()
		// 	// 		Object.keys(variants).forEach((dep) => {
		// 	// 			const value = variants[dep]
		// 	// 			const [cns, cn, ns] = parseVariantKey(dep)
		// 	// 			value.component = cns + "." + cn
		// 	// 			value.namespace = ns
		// 	// 			const yamlValue =
		// 	// 				getNodeAtPath(dep, variantsNode)?.toString() || ""
		// 	// 			componentVariantsToAdd.push({
		// 	// 				key: dep,
		// 	// 				content: yamlValue,
		// 	// 				parsed: value,
		// 	// 			})
		// 	// 		})
		// 	// 	}
		// 	// }

		// 	// TODO: This can be removed once we move to React 18
		// 	batch(() => {
		// 		dispatch(setViewDef(viewToAdd))
		// 		//dispatch(setComponentPack(componentPacksToAdd))
		// 		// dispatch(setConfigValue(configValuesToAdd))
		// 		// dispatch(setLabel(labelsToAdd))
		// 		//dispatch(setComponentVariant(componentVariantsToAdd))
		// 	})
		// }
		// viewDef = viewSelectors.selectById(getState(), viewDefId)
		if (!viewDef) throw new Error("Could not get View Def")

		const definition = viewDef.parsed as ViewDefinition
		const wires = definition.wires || {}
		const wireNames = wires ? Object.keys(wires) : []

		if (wireNames?.length) {
			// Initialize Wires
			dispatch(initializeWiresOp(context, wires))
			await dispatch(loadWiresOp(context, wireNames))
		}

		// Handle Events
		const onloadEvents = definition.events?.onload
		if (onloadEvents) {
			await runMany(onloadEvents, context)
		}

		return context
	}
