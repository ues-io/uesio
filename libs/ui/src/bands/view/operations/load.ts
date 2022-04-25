import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { selectors as metadataSelectors } from "../../metadata/adapter"
import loadWiresOp from "../../wire/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { PlainView, ViewParams } from "../types"
import { runMany } from "../../../signals/signals"
import { parseKey } from "../../../component/path"
import { setMany as setMetadata } from "../../metadata"
import { PlainViewDef2 } from "../../viewdef/types"
import { MetadataState } from "../../metadata/types"
import {
	getNodeAtPath,
	parse,
	removeNodeAtPath,
} from "../../../yamlutils/yamlutils"

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

	let viewDef = metadataSelectors.selectById(
		api.getState(),
		"view:" + viewDefId
	)

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
		removeNodeAtPath("dependencies", yamlDoc.contents)

		const metadataToAdd: MetadataState[] = [
			{
				key: viewDefId,
				type: "view",
				content: viewDefResponse,
				parsed: yamlDoc.toJSON(),
			},
		]

		if (depsNode) {
			const packsNode = getNodeAtPath("componentpacks", depsNode)
			if (packsNode) {
				const packs = packsNode.toJSON()
				Object.keys(packs).forEach((dep) => {
					metadataToAdd.push({
						key: dep,
						type: "componentpack",
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
					metadataToAdd.push({
						key: dep,
						type: "configvalue",
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
					metadataToAdd.push({
						key: dep,
						type: "label",
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
					const yamlValue =
						getNodeAtPath(dep, variantsNode)?.toString() || ""
					metadataToAdd.push({
						key: dep,
						type: "componentvariant",
						content: yamlValue,
						parsed: value,
					})
				})
			}
		}

		api.dispatch(setMetadata(metadataToAdd))
	}
	viewDef = metadataSelectors.selectById(api.getState(), "view:" + viewDefId)
	if (!viewDef) throw new Error("Could not get View Def")

	const content = viewDef.parsed as PlainViewDef2
	const definition = content.definition
	const wires = definition.wires
	const wireNames = wires ? Object.keys(wires) : []

	// Initialize Wires
	api.dispatch(initializeWiresOp(context, wireNames))

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
