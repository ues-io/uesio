import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { PlainView, ViewParams } from "../types"
import { runMany } from "../../../signals/signals"
import { parseKey, parseVariantKey } from "../../../component/path"
import { selectors as viewSelectors, set as setViewDef } from "../../viewdef"
import { setMany as setComponentPack } from "../../componentpack"
import { setMany as setConfigValue } from "../../configvalue"
import { setMany as setLabel } from "../../label"
import { setMany as setComponentVariant } from "../../componentvariant"
import { ViewDefinition } from "../../../definition/viewdef"
import { MetadataState } from "../../metadata/types"
import { getNodeAtPath, newDoc, parse } from "../../../yamlutils/yamlutils"
import { batch } from "react-redux"

export default createAsyncThunk<
	PlainView,
	{
		context: Context
		path: string
		params: ViewParams | undefined
	},
	UesioThunkAPI
>("view/load", async ({ context, path }, api) => {
	// First check to see if we have the viewDef
	const viewDefId = context.getViewDefId()
	if (!viewDefId) throw new Error("No View Def Context Provided")

	let viewDef = viewSelectors.selectById(api.getState(), viewDefId)

	if (!viewDef) {
		const [namespace, name] = parseKey(viewDefId)
		const viewDefResponse = await api.extra.getView(
			context,
			namespace,
			name
		)

		const yamlDoc = parse(viewDefResponse)
		//const definitionNode = getNodeAtPath("definition", yamlDoc.contents)
		const depsNode = getNodeAtPath("dependencies", yamlDoc.contents)
		const defNode = getNodeAtPath("definition", yamlDoc.contents)
		// removeNodeAtPath("dependencies", yamlDoc.contents)
		const defDoc = newDoc()
		defDoc.contents = defNode
		const viewContent = defDoc?.toString()
		const viewToAdd: MetadataState = {
			key: viewDefId,
			content: viewContent || "",
			original: viewContent,
			parsed: defNode?.toJSON(),
		}

		const componentPacksToAdd: MetadataState[] = []
		const configValuesToAdd: MetadataState[] = []
		const labelsToAdd: MetadataState[] = []
		const componentVariantsToAdd: MetadataState[] = []

		if (depsNode) {
			const packsNode = getNodeAtPath("componentpacks", depsNode)
			if (packsNode) {
				const packs = packsNode.toJSON()
				Object.keys(packs).forEach((dep) => {
					componentPacksToAdd.push({
						key: dep,
						content: "",
						parsed: undefined,
					})
				})
			}
			const configNode = getNodeAtPath("configvalues", depsNode)
			if (configNode) {
				const configs = configNode.toJSON()
				Object.keys(configs).forEach((dep) => {
					const value = configs[dep]
					configValuesToAdd.push({
						key: dep,
						content: value || "",
						parsed: undefined,
					})
				})
			}
			const labelsNode = getNodeAtPath("labels", depsNode)
			if (labelsNode) {
				const labels = labelsNode.toJSON()
				Object.keys(labels).forEach((dep) => {
					const value = labels[dep]
					labelsToAdd.push({
						key: dep,
						content: value || "",
						parsed: undefined,
					})
				})
			}
			const variantsNode = getNodeAtPath("componentvariants", depsNode)
			if (variantsNode) {
				const variants = variantsNode.toJSON()
				Object.keys(variants).forEach((dep) => {
					const value = variants[dep]
					const [cns, cn, ns] = parseVariantKey(dep)
					value.component = cns + "." + cn
					value.namespace = ns
					const yamlValue =
						getNodeAtPath(dep, variantsNode)?.toString() || ""
					componentVariantsToAdd.push({
						key: dep,
						content: yamlValue,
						parsed: value,
					})
				})
			}
		}

		// TODO: This can be removed once we move to React 18
		batch(() => {
			api.dispatch(setViewDef(viewToAdd))
			api.dispatch(setComponentPack(componentPacksToAdd))
			api.dispatch(setConfigValue(configValuesToAdd))
			api.dispatch(setLabel(labelsToAdd))
			api.dispatch(setComponentVariant(componentVariantsToAdd))
		})
	}
	viewDef = viewSelectors.selectById(api.getState(), viewDefId)
	if (!viewDef) throw new Error("Could not get View Def")

	const definition = viewDef.parsed as ViewDefinition
	const wires = definition.wires || {}
	const wireNames = wires ? Object.keys(wires) : []

	// Initialize Wires
	api.dispatch(initializeWiresOp(context, wires))

	if (wireNames?.length) {
		await api.dispatch(
			loadWiresOp({
				context,
				wires: wireNames,
			})
		)
	}

	// Handle Events
	const onloadEvents = definition.events?.onload
	if (onloadEvents) {
		await runMany(api.dispatch, "", onloadEvents, context)
	}

	return {
		viewDefId: viewDef.key,
		path,
		loaded: true,
	}
})
