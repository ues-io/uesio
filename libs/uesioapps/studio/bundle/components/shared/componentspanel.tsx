import { CSSProperties, FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import { getOnDragStartToolbar, getOnDragStopToolbar } from "./dragdrop"
import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"
import DragIndicator from "@material-ui/icons/DragIndicator"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

interface Props extends definition.BaseProps {
	style?: CSSProperties
}

const ComponentsPanel: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const contentView = uesio.builder.useView() === "contentview"
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
					{...props}
				/>
			}
			{...props}
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
						>
							<div>
								{filteredList[element].map((value, indexTag) =>
									contentView ? (
										<PropNodeTag
											title={value}
											key={indexTag}
										/>
									) : (
										<PropNodeTag
											draggable={component.dragdrop.createComponentBankKey(
												element,
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
		</ScrollPanel>
	)
}

export default ComponentsPanel
