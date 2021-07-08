import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"

import { getOnDragStartToolbar, getOnDragStopToolbar } from "./dragdrop"
import ExpandPanel from "./expandpanel"
import PropNodeTag from "./buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

type ComponentItem = {
	name: string
	description: string
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

	// Structure component data so it's easily mappable in the render function
	const namespaces = builderComponents.reduce(
		(arr: Namespace[], builderComponent: string) => {
			const [namespace, name] = component.path.parseKey(builderComponent)
			const definition = component.registry.getPropertiesDefinition(
				`${namespace}.${name}`
			)
			if (!definition?.traits?.includes("uesio.standalone")) return arr

			const componentItem = {
				name,
				description: definition.description || definition.title,
			}
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
								{ name, description }: ComponentItem,
								indexTag: number
							) =>
								!isStructureView ? (
									<PropNodeTag
										title={name}
										key={indexTag}
										context={context}
									/>
								) : (
									<PropNodeTag
										draggable={component.dragdrop.createComponentBankKey(
											namespace,
											name
										)}
										title={name}
										icon="drag_indicator"
										key={indexTag}
										tooltip={description}
										context={context}
									/>
								)
						)}
					</ExpandPanel>
				))}
			</div>
		</ScrollPanel>
	)
}

export default ComponentsPanel
