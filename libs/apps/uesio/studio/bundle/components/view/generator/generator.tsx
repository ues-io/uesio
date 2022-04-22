import { FunctionComponent, useEffect, useState } from "react"
import { definition, wire, hooks, component, context } from "@uesio/ui"
import { TEST } from "libs/ui/src/platform/platform"

type GeneratorDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
}

interface Props extends definition.BaseProps {
	definition: GeneratorDefinition
}

const init = (
	usage: string,
	collectionMrg: string,
	namespaceMrg: string,
	context: context.Context
): [string, string, context.Context] => {
	if (usage === "site") {
		const view = context.getView()
		const appName = view?.params?.app
		const siteName = view?.params?.sitename
		const [namespace] = component.path.parseKey(collectionMrg)
		return [
			namespace,
			collectionMrg,
			context.addFrame({
				siteadmin: {
					name: siteName || "",
					app: appName || "",
				},
			}),
		]
	}
	return [namespaceMrg, `${namespaceMrg}.${collectionMrg}`, context]
}

const Field = component.registry.getUtility("uesio/io.field")

const Generator: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition.collectionId)
	const namespaceMrg = context.merge(definition.namespace)
	const usage = definition.usage

	const [namespace, collection, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const [data, setData] = useState<TEST>([])

	// /version/uesio/crm/uesio/core/v0.0.1/bots/params/generator/theme

	useEffect(() => {
		;(async () => {
			const data = await uesio.platform.getMetadata(
				context,
				"theme",
				"BOT",
				"uesio/core",
				"GENERATOR"
			)
			setData(data)
		})()
	}, [])

	console.log(data[0])

	// // Get Field info
	// useEffect(() => {
	// 	// Create on-the-fly wire
	// 	if (!params) return
	// 	const fields: wire.ViewOnlyWireFieldDefinitionMap = {}
	// 	params.forEach((record) => {
	// 		fields[`uesio/viewonly.${record.name}`] = {
	// 			label: record.name,
	// 			required: false,
	// 			type: "TEXT",
	// 		}
	// 	})

	// 	const basePath = `["viewdef"]["${newContext.getViewDefId()}"]["wires"]`
	// 	uesio.builder.addDefinitionPair(
	// 		basePath,
	// 		{
	// 			viewOnly: true,
	// 			fields,
	// 			init: { create: true },
	// 		},
	// 		"botparamsdata"
	// 	)

	// 	uesio.wire.initWires(newContext, ["botparamsdata"])
	// 	//uesio.wire.loadWires(newContext, ["botparamsdata"])

	// 	return () => {
	// 		uesio.builder.removeDefinition(`${basePath}["botparamsdata"]`)
	// 	}
	// }, [params])

	// if (!params) return null

	return (
		<>
			<h1>Hola</h1>
		</>

		// <List
		// 	id="TEST"
		// 	wire="botparamsdata"
		// 	mode="EDIT"
		// 	context={newContext}
		// 	components={<h1>HOLA</h1>}
		// />

		// <component.Component
		// 	componentType="uesio/io.list"
		// 	definition={{
		// 		id: "collectionDataTableeweqweqweqw",
		// 		wire: "botparamsdata",
		// 		mode: "EDIT",
		// 		components: params.map((record) => ({
		// 			// ["uesio/io.field"]: {
		// 			// 	fieldId: `uesio/viewonly.${record.name}`,
		// 			// },
		// 			["uesio/io.text"]: {
		// 				text: `random`,
		// 			},
		// 		})),
		// 	}}
		// 	path={props.path}
		// 	context={newContext}
		// />
	)
}

export default Generator
