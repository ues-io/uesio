import { FC } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, component, definition } from "@uesio/ui"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const ListField = component.registry.getUtility("io.listfield")

type StyleValue = {
	key: string
	value: string
}

const StylesListProp: FC<PropRendererProps> = (props) => {
	const { context, path, propsDef, valueAPI } = props

	const styleData = valueAPI.get(path) as definition.DefinitionMap

	return (
		<div>
			{propsDef.classes && (
				<FieldLabel label={"Inline Styles"} context={context} />
			)}
			{propsDef.classes?.map((className) => {
				const data = styleData?.[className] as definition.DefinitionMap
				return (
					<ListField
						label={className}
						value={
							data
								? Object.keys(data).map((key) => ({
										key,
										value: data[key],
								  }))
								: []
						}
						autoAdd
						subFields={[
							{
								name: "key",
							},
							{ name: "value" },
						]}
						setValue={(value: StyleValue[]) =>
							valueAPI.set(
								`${path}["${className}"]`,
								value.reduce(
									(obj, item) => ({
										...obj,
										[item.key]: item.value,
									}),
									{}
								)
							)
						}
						mode="EDIT"
						context={context}
					/>
				)
			})}
		</div>
	)
}

export default StylesListProp
