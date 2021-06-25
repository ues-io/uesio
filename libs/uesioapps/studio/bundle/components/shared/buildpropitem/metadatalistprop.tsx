import { FC } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import KeyValueList, { ListItem } from "../../KeyValueList"
import { hooks, component } from "@uesio/ui"
import { MetadataListProp } from "../../../../../../ui/src/buildmode/buildpropdefinition"

const MetadataListProp: FC<PropRendererProps> = (props) => {
	// const {
	// 	view: { setDefinition, useDefinition },
	// } = hooks.useUesio(props)
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor as MetadataListProp
	type List = ListItem[]

	const { getValue, context, path, definition } = props

	// We need a way to format the style list for the Yaml Definition
	// [{key: 'padding', value: '12px'}] ==> {..., padding: '12px'}
	const styleObject = (styles: List) =>
		styles.reduce(
			(obj, item) => ({
				...obj,
				[item.key]: item.value,
			}),
			{}
		)

	// const classes = section.

	// 2. add properties for each class
	console.log("def", definition)
	const handleUpdate = (className: string, list: List) => {
		if (!list.length) return
		const styleDefinition = styleObject(list)
		uesio.view.setDefinition(
			`${path}["${descriptor.name}"]["${className}"]`,
			styleDefinition
		)

		// uesio.view.addDefinition(path + '["' + descriptor.name + '"]{"hy"}', {
		// 	foo: "bar",
		// 	padding: "24px",
		// })
	}
	return (
		<div>
			{descriptor.classes.map((el, i) => (
				<div>
					<span>{el}</span>
					<KeyValueList
						onListUpdate={(list: List) => handleUpdate(el, list)}
						context={context}
						value={[{ key: "padding", value: "12px" }]}
					/>
				</div>
			))}
		</div>
	)
}

export default MetadataListProp
