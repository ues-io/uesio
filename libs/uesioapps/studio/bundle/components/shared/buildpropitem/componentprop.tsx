import { FC, useState, useEffect } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import BuildPropArea from "../buildproparea/buildproparea"

import { component, hooks } from "@uesio/ui"

const SelectField = component.registry.getUtility("io.selectfield")
const TextField = component.registry.getUtility("io.textfield")

const ComponentProp: FC<PropRendererProps> = (props) => {
	const { descriptor, valueAPI, context, path } = props
	const parentPath = component.path.getParentPath(path || "")
	const selectedPanelComponentContainer = valueAPI.get(parentPath) as string
	const panelComponent = {
		key: Object.keys(selectedPanelComponentContainer)[0],
		...(Object.values(selectedPanelComponentContainer)[0] as any),
	}

	const idxPath = component.path.fromPath([
		...component.path.pathArray(path || "").slice(0, -1),
		panelComponent.key,
		"idx",
	])
	const [idx, setIdx] = useState(valueAPI.get(idxPath))
	const propsDef = component.registry.getPropertiesDefinition(
		panelComponent.key
	)

	const options = component.registry.getComponents({
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
		panelComponent.key,
	]

	useEffect(() => {
		if (!idx) {
			valueAPI.set(idxPath, Math.floor(Math.random() * 60))
		}
	}, [propsDef, idx])

	return (
		<>
			{selectOptions ? (
				<SelectField
					value={panelComponent.key}
					label={descriptor.label}
					options={selectOptions}
					setValue={(value: string) => {
						valueAPI.changeKey(parentPath, value)
					}}
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
