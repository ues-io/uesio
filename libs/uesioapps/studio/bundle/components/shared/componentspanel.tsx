import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import { getOnDragStartToolbar, getOnDragStopToolbar } from "./dragdrop"
import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const isStructureView = uesio.builder.useIsStructureView()
	const onDragStart = getOnDragStartToolbar(uesio)
	const onDragEnd = getOnDragStopToolbar(uesio)

	const filteredList: Record<string, string[]> = {}

	component.registry.getBuilderComponents().forEach((key: string) => {
		const [namespace, name] = component.path.parseKey(key)

		const names = filteredList[namespace] || []

		const definition = component.registry.getPropertiesDefinition(
			`${namespace}.${name}`
		)
		if (definition?.traits?.includes("uesio.standalone")) {
			names.push(name)
		}

		filteredList[namespace] = names
	})

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"Components"}
					context={context}
				/>
			}
			context={context}
		>
			<div
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				style={{
					overflow: "auto",
					flex: 1,
				}}
			>
				{Object.keys(filteredList)
					.filter((element) => filteredList[element].length)
					.map((element, index) => (
						<ExpandPanel
							title={element}
							defaultExpanded={true}
							key={index}
							context={context}
						>
							<div>
								{filteredList[element].map((value, indexTag) =>
									!isStructureView ? (
										<PropNodeTag
											title={value}
											key={indexTag}
											context={context}
										/>
									) : (
										<PropNodeTag
											draggable={component.dragdrop.createComponentBankKey(
												element,
												value
											)}
											title={value}
											icon="drag_indicator"
											key={indexTag}
											context={context}
										/>
									)
								)}
							</div>
						</ExpandPanel>
					))}
			</div>
		</ScrollPanel>
	)
}

export default ComponentsPanel
