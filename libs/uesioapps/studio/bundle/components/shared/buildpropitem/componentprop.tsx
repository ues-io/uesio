import { FC, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import BuildPropArea from "../buildproparea/buildproparea"

import { component, hooks } from "@uesio/ui"

const SelectField = component.registry.getUtility("io.selectfield")

const ComponentProp: FC<PropRendererProps> = (props) => {
	const { descriptor, valueAPI, context, path } = props
	const uesio = hooks.useUesio(props)
	const parentPath = component.path.getParentPath(path || "")
	const selectedPanelComponentContainer = valueAPI.get(parentPath) as string
	const selectedPanelComponent = Object.values(
		selectedPanelComponentContainer
	)[0] as any
	const selectedPanelComponentName = Object.keys(
		selectedPanelComponentContainer
	)[0]
	const propsDef = component.registry.getPropertiesDefinition(
		selectedPanelComponentName
	)

	const options = component.registry.getItems({
		trait: "uesio.panel",
	})
	const selectOptions = Object.values(options.io).map(
		({ namespace, name }) => ({
			value: `${namespace}.${name}`,
			label: `${namespace}.${name}`,
		})
	)

	const targetPath = [
		...component.path.pathArray(path || "").slice(0, -1),
		selectedPanelComponentName,
	]
	useEffect(() => {
		valueAPI.set(
			component.path.fromPath([...targetPath, "id"]),
			selectedPanelComponentName
		)
	}, [selectedPanelComponentName])
	return (
		<>
			{selectOptions ? (
				<SelectField
					value={selectedPanelComponentName}
					label={descriptor.label}
					options={selectOptions}
					setValue={(value: string) =>
						valueAPI.changeKey(parentPath, value)
					}
					context={context}
				/>
			) : (
				<p>No available panels found</p>
			)}

			{propsDef ? (
				<BuildPropArea
					path={component.path.fromPath(targetPath)}
					valueAPI={valueAPI}
					context={context}
					propsDef={propsDef}
				/>
			) : (
				<p>no propsdef found</p>
			)}
		</>
	)
}

export default ComponentProp
