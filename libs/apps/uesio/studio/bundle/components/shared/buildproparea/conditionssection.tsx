import { FunctionComponent } from "react"
import { definition, wire, component } from "@uesio/ui"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ConditionItem from "../buildpropitem/conditionItem"

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const defaultConditionDef = {
	field: null,
	operator: "",
}
const defaultConditionGroupDef = {
	type: "GROUP",
	conjunction: "AND",
	conditions: [defaultConditionDef],
}

const ConditionsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, valueAPI } = props
	const wireDef = valueAPI.get(path || "") as
		| definition.DefinitionMap
		| undefined

	const conditionsDef = wireDef?.conditions as
		| definition.Definition[]
		| undefined

	const conditionsPath = `${path}["conditions"]`

	return (
		<>
			<TitleBar
				variant="uesio/studio.propsubsection"
				title={""}
				context={context}
				actions={
					<>
						<Button
							context={context}
							variant="uesio/studio.actionbutton"
							icon={
								<Icon
									context={context}
									icon="library_add"
									variant="uesio/studio.actionicon"
								/>
							}
							label="Add Group"
							onClick={() => {
								valueAPI.add(
									conditionsPath,
									defaultConditionGroupDef
								)
							}}
						/>
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
							label="Add Condition"
							onClick={() => {
								valueAPI.add(
									conditionsPath,
									defaultConditionDef
								)
							}}
						/>
					</>
				}
			/>
			{conditionsDef?.map((condition: wire.WireConditionState, index) => {
				const conditionPath = `${conditionsPath}["${index}"]`

				return (
					<ConditionItem
						key={conditionPath}
						conditionPath={conditionPath}
						context={context}
						condition={condition}
						valueAPI={valueAPI}
					/>
				)
			})}
		</>
	)
}

export default ConditionsSection
