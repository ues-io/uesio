import { FunctionComponent } from "react"
import { definition, builder, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import PropertiesPane from "../propertiespane"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"
import { useSelectedPath } from "../../api/stateapi"

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
		groupingPath: "../../collection",
	},
	{
		name: "desc",
		type: "BOOLEAN",
		label: "Descending",
	},
]

type OrderDefinition = { desc: boolean; field: string }

const OrderSection: FunctionComponent<SectionRendererProps> = (props) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const { path, context } = props
	const wireDef = {} as definition.DefinitionMap | undefined

	const selectedPath = useSelectedPath(context)
	const viewDefId = context.getViewDefId()
	if (!viewDefId) return null

	const orderDef = wireDef?.order as definition.Definition[] | undefined

	const ordersPath = `${path}["order"]`

	return (
		<>
			<TitleBar
				variant="uesio/builder.propsubsection"
				title={""}
				context={context}
				actions={
					<Button
						context={context}
						variant="uesio/builder.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/builder.actionicon"
							/>
						}
						label="New Ordering"
						onClick={() => {
							//valueAPI.add(ordersPath, {
							//	field: null,
							//	desc: false,
							//})
						}}
					/>
				}
			/>
			{orderDef?.map((order: OrderDefinition, index) => {
				const orderPath = `${ordersPath}["${index}"]`
				const selected = selectedPath.localPath.startsWith(orderPath)
				return (
					<PropNodeTag
						selected={selected}
						key={index}
						onClick={() => {
							/*
							api.builder.setSelectedNode(
								"viewdef",
								viewDefId,
								orderPath
							)
							*/
						}}
						popperChildren={
							<PropertiesPane
								path={orderPath}
								context={context}
								propsDef={{
									title: "Order By",
									sections: [],
									defaultDefinition: () => ({}),
									properties: getOrderProperties(),
								}}
							/>
						}
						context={context}
					>
						<div className="tagroot">{getOrderTitle(order)}</div>
					</PropNodeTag>
				)
			})}
		</>
	)
}

export default OrderSection
