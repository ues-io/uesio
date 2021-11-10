import { FC, useState, useEffect } from "react"
import { component, builder } from "@uesio/ui"
import Proplist from "../buildproparea/proplist"

const SelectField = component.registry.getUtility("io.selectfield")

const ComponentProp: FC<builder.PropRendererProps> = (props) => {
	const { descriptor, valueAPI, context, path } = props
	const parentPath = component.path.getParentPath(path || "")
	const componentName = component.path.getPathSuffix(parentPath) || ""
	const propsDef = component.registry.getPropertiesDefinition(componentName)

	const componentOptions = Object.entries(
		component.registry.getComponents("uesio.standalone")
	).reduce((acc, [namespace, components]) => {
		const namespaceComponents = Object.keys(components).map((cname) => ({
			value: `${namespace}.${cname}`,
			label: `${namespace}.${cname}`,
		}))
		return [...acc, ...namespaceComponents]
	}, [])

	return (
		<>
			{componentOptions ? (
				<SelectField
					value={componentName}
					label={descriptor.label}
					options={componentOptions}
					setValue={(value: string) => {
						valueAPI.changeKey(parentPath, value)
					}}
					context={context}
				/>
			) : (
				<p>No available panels found</p>
			)}

			{propsDef && propsDef.properties && path && path.length ? (
				<Proplist
					path={path}
					valueAPI={valueAPI}
					context={context}
					propsDef={propsDef}
					properties={propsDef.properties.filter(
						(el) => el.type !== "COMPONENT"
					)} // we dont want a loop
				/>
			) : (
				<p>no propsdef found</p>
			)}
		</>
	)
}

export default ComponentProp
