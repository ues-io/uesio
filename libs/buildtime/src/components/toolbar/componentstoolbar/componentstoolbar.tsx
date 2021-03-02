import React, { FunctionComponent } from "react"
import { component, definition, hooks } from "@uesio/ui"
import ToolbarTitle from "../toolbartitle"
import ExpandPanel from "../expandpanel/expandpanel"
import PropNodeTag from "../../buildpropitem/propnodetag"
import DragIndicator from "@material-ui/icons/DragIndicator"
import {
	getOnDragStartToolbar,
	getOnDragStopToolbar,
} from "../../../utils/draganddrop"

interface Props extends definition.BaseProps {
	selectedNode: string
}

interface filteredListInterface {
	namespace: string
	names: string[]
}

const ComponentsToolbar: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const contentView = uesio.builder.useView() === "contentview"
	const onDragStart = getOnDragStartToolbar(uesio)
	const onDragEnd = getOnDragStopToolbar(uesio)

	const filteredList: Array<filteredListInterface> = []

	component.registry.getBuilderNamespaces().forEach((namespace: string) => {
		const filteredListItem = {} as filteredListInterface
		filteredListItem.namespace = namespace
		filteredListItem.names = []

		component.registry
			.getBuilderComponents(namespace)
			.forEach((name: string) => {
				const definition = component.registry.getPropertiesDefinition(
					`${namespace}.${name}`
				)
				if (definition?.traits?.includes("uesio.standalone")) {
					filteredListItem.names.push(name)
				}
			})
		if (filteredListItem.names.length) {
			filteredList.push(filteredListItem)
		}
	})

	return (
		<>
			<ToolbarTitle title="Components" />
			<div
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				style={{
					overflow: "auto",
					flex: 1,
				}}
			>
				{filteredList.map((element, index) => (
					<ExpandPanel
						title={element.namespace}
						defaultExpanded={true}
						key={index}
					>
						<div>
							{element.names.map((value, indexTag) =>
								contentView ? (
									<PropNodeTag title={value} key={indexTag} />
								) : (
									<PropNodeTag
										draggable={component.dragdrop.createComponentBankKey(
											element.namespace,
											value
										)}
										title={value}
										icon={DragIndicator}
										key={indexTag}
									/>
								)
							)}
						</div>
					</ExpandPanel>
				))}
			</div>
		</>
	)
}

export default ComponentsToolbar
