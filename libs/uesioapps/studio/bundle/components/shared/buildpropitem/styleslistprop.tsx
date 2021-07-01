import { FC } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, component } from "@uesio/ui"

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const ListField = component.registry.getUtility("io.listfield")

type StyleValue = {
	key: string
	value: string
}

const StylesListProp: FC<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, path, definition, descriptor, propsDef } = props

	const styleData = definition?.["uesio.styles"]

	return (
		<div>
			<FieldLabel label={"Inline Styles"} context={context} />
			{propsDef.classes?.map((className) => {
				const data = styleData?.[className]
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
							uesio.view.setDefinition(
								`${path}["${descriptor.name}"]["${className}"]`,
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
