import { FunctionComponent } from "react"
import { definition, hooks, builder, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropNodeTag from "../buildpropitem/propnodetag"
import PropertiesPane from "../propertiespane"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

function getOrderTitle(order: OrderDefinition): string {
	if (order.field) {
		return `${order.field} | ${order.desc ? "Descending" : "Ascending"}`
	}
	return "NEW_VALUE"
}

const getOrderProperties = (): builder.PropDescriptor[] => [
	{
		name: "field",
		type: "METADATA",
		metadataType: "FIELD",
		label: "Field",
		groupingParents: 2,
		groupingProperty: "collection",
	},
	{
		name: "desc",
		type: "BOOLEAN",
		label: "Descending",
	},
]

type OrderDefinition = { desc: boolean; field: string }

const OrderSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const wireDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined
	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const [, , selectedNode] = uesio.builder.useSelectedNode()
	const viewDefId = uesio.getViewDefId()
	if (!viewDefId) return null

	const orderDef = wireDef?.order as definition.Definition[] | undefined
	const primaryColor = theme.definition.palette.primary

	const ordersPath = `${path}["order"]`

	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/studio.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/studio.actionicon"
							/>
						}
						label="New Ordering"
						onClick={() => {
							valueAPI.add(ordersPath, {
								field: null,
								desc: false,
							})
						}}
					/>
				}
			/>
			{orderDef?.map((order: OrderDefinition, index) => {
				const orderPath = `${ordersPath}["${index}"]`
				const selected = selectedNode.startsWith(orderPath)
				return (
					<PropNodeTag
						selected={selected}
						key={index}
						onClick={() => {
							uesio.builder.setSelectedNode(
								"viewdef",
								viewDefId,
								orderPath
							)
						}}
						popperChildren={
							<PropertiesPane
								path={orderPath}
								index={0}
								context={context}
								propsDef={{
									title: "Order By",
									sections: [],
									defaultDefinition: () => ({}),
									properties: getOrderProperties(),
									actions: [],
								}}
								valueAPI={valueAPI}
							/>
						}
						context={context}
					>
						{getOrderTitle(order)}
					</PropNodeTag>
				)
			})}
		</>
	)
}

export default OrderSection
