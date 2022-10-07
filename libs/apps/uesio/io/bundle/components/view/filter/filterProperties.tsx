import { builder, component, hooks } from "@uesio/ui"
// import { FC } from "react"

const FilterProperties: builder.PropComponent<builder.CustomProp> = (props) => {
	// const uesio = hooks.useUesio(props)
	const { path, valueAPI } = props
	const uesio = hooks.useUesio(props)
	const parentPath = component.path.getParentPath(path || "")
	const parentDef = valueAPI.get(parentPath) as any
	console.log({ parentDef })

	const wire = uesio.wire.useWire(parentDef.wire)
	if (!wire) return null

	const collection = wire.getCollection()
	const fieldType = collection.getField(parentDef?.field)?.getType()

	if (!fieldType) return
	const properties = component.registry.getPropertiesDefinition(
		`uesio/io.filter${fieldType.toLowerCase()}`
	)
	console.log({})
	return (
		<PropList
			path={path}
			propsDef={propsDef}
			properties={propsDef.properties}
			context={context}
			valueAPI={valueAPI}
		/>
	)
}

export default FilterProperties
