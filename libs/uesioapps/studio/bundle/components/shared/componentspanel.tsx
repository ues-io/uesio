import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import { getOnDragStartToolbar, getOnDragStopToolbar } from "./dragdrop"
import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const Tooltip = component.registry.getUtility("io.tooltip")

type ComponentItem = {
	name: string
	tooltip: string
}

type Namespace = {
	namespace: string
	components: ComponentItem[]
}

const ComponentsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const isStructureView = uesio.builder.useIsStructureView()
	const onDragStart = getOnDragStartToolbar(uesio)
	const onDragEnd = getOnDragStopToolbar(uesio)
	const builderComponents = component.registry.getBuilderComponents()
	console.log(builderComponents)

	// Structure component data so it's easily mappable in the render function
	const namespaces = builderComponents.reduce(
		(arr: Namespace[], el: ComponentItem) => {
			const [namespace, name] = component.path.parseKey(el.name)
			const definition = component.registry.getPropertiesDefinition(
				`${namespace}.${name}`
			)
			if (!definition?.traits?.includes("uesio.standalone")) return arr

			const componentItem = { name, tooltip: el.tooltip }
			const namespaceToUpdate = arr.findIndex(
				(el) => el.namespace === namespace
			)

			if (namespaceToUpdate === -1)
				return [...arr, { namespace, components: [componentItem] }]

			const newComponentsArr: ComponentItem[] = [
				...arr[namespaceToUpdate].components,
				componentItem,
			]
			return arr.map((el: Namespace, i: number) => {
				const namespace = el
				if (i === namespaceToUpdate) {
					namespace.components = newComponentsArr
				}
				return namespace
			})
		},
		[]
	)

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
				{namespaces.map(({ namespace, components }, index) => (
					<ExpandPanel
						title={namespace}
						defaultExpanded={true}
						key={index}
						context={context}
					>
						{components.map(
							(
								{ name, tooltip }: ComponentItem,
								indexTag: number
							) =>
								!isStructureView ? (
									<PropNodeTag
										title={name}
										key={indexTag}
										context={context}
									/>
								) : (
									<Tooltip
										text={tooltip}
										context={context}
										placement={"auto"}
									>
										<PropNodeTag
											draggable={component.dragdrop.createComponentBankKey(
												namespace,
												name
											)}
											title={name}
											icon="drag_indicator"
											key={indexTag}
											context={context}
										/>
									</Tooltip>
								)
						)}
					</ExpandPanel>
				))}
			</div>
		</ScrollPanel>
	)
}

export default ComponentsPanel
