import { FC } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import BuildPropArea from "../buildproparea/buildproparea"

import { component, hooks } from "@uesio/ui"

const SelectField = component.registry.getUtility("io.selectfield")

const ComponentProp: FC<PropRendererProps> = (props) => {
	const { descriptor, valueAPI, context, path } = props
	const uesio = hooks.useUesio(props)
	const selectedPanelComponentName = valueAPI.get(path) as string

	const propsDef = component.registry.getPropertiesDefinition(
		selectedPanelComponentName
	)

	const options: any = component.registry.getItems({
		trait: "uesio.panel",
	})

	const selectOptions = Object.values(options.io).map(
		({ namespace, name }) => ({
			value: `${namespace}.${name}`,
			label: `${namespace}.${name}`,
		})
	)

	return (
		<>
			<SelectField
				value={valueAPI.get(path)}
				label={descriptor.label}
				options={selectOptions}
				setValue={(value: string) => valueAPI.set(path, value)}
				context={context}
			/>

			{propsDef && (
				<BuildPropArea
					path={path}
					valueAPI={valueAPI}
					context={context}
					propsDef={propsDef}
				/>
			)}
		</>
	)
}

export default ComponentProp
