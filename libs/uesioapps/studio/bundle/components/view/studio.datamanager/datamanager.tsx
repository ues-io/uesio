import { FunctionComponent, useEffect } from "react"
import { definition, styles, wire, hooks, component } from "@uesio/ui"

type DataManagerDefinition = {
	collectionId: string
	namespace: string
	fieldsWire: string
}

interface Props extends definition.BaseProps {
	definition: DataManagerDefinition
}

const DataManager: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionId = context.merge(definition.collectionId)
	const namespace = context.merge(definition.namespace)
	const fieldsWire = uesio.wire.useWire(definition.fieldsWire)

	// Get Field info
	const dataWire = useEffect(() => {
		// Create on-the-fly wire
		if (!fieldsWire) return
		const fields: wire.WireFieldDefinitionMap = {}
		fieldsWire.getData().forEach((record) => {
			fields[`${namespace}.${record.getFieldString("studio.name")}`] =
				null
		})
		uesio.view.addDefinitionPair(
			`["wires"]`,
			{
				collection: `${namespace}.${collectionId}`,
				fields,
			},
			"collectionData"
		)

		uesio.wire.loadWires(context, ["collectionData"])

		return () => {
			uesio.view.removeDefinition(`["wires"]["collectionData"]`)
		}
	}, [])

	if (!fieldsWire) return null

	return (
		<component.Component
			componentType="io.table"
			definition={{
				id: "collectionDataTable",
				wire: "collectionData",
				mode: "EDIT",
				columns: fieldsWire.getData().map((record) => ({
					["io.column"]: {
						field: `${namespace}.${record.getFieldString(
							"studio.name"
						)}`,
					},
				})),
			}}
			path={props.path}
			context={context}
		/>
	)
}

export default DataManager
