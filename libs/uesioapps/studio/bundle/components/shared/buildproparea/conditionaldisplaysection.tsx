import React, { FC, useState } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder, component, definition, wire, styles } from "@uesio/ui"
import PropList from "./proplist"
import PropNodeTag from "../buildpropitem/propnodetag"

import ConditionProp, { Condition } from "./displayconditions/conditionprop"

const ConditionalDisplaySection: FC<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection

	const classes = styles.useStyles(
		{
			root: {},
			conditionProp: {
				border: "1px solid red",
				marginBottom: "1em",
			},
		},
		props
	)

	const conditions = valueAPI.get(`${path}["uesio.display"]`) as Condition[]

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.display",
			type: "CONDITIONALDISPLAY",
			label: "Conditional Display",
		},
	]

	const onClick = () => {
		console.log("click")
	}

	const comparisonOperators = ["=", "<", ">", "!="]

	const [comparisonOperator, setComparisonOperator] = useState<string>("")

	const def = valueAPI.get(path || "") as definition.DefinitionMap | undefined
	const displayConditions: any[] = def
		? (def["uesio.display"] as any[]) || []
		: []

	return (
		<>
			{/* <ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		> */}
			{/* <SelectField
				context={context}
				label={""}
				value={comparisonOperator}
				options={comparisonOperators.map((x) => ({
					value: x,
					label: x,
				}))}
				setValue={(value: string) => setComparisonOperator(value)}
			/> */}

			{/* // </ExpandPanel> */}
			<pre>{JSON.stringify(conditions, null, 2)}</pre>
			{conditions?.length &&
				conditions.map((c, index) => (
					<ConditionProp
						className={classes.conditionProp}
						path={path}
						index={index}
						condition={c}
						context={context}
						valueAPI={valueAPI}
					/>
				))}

			{/* {displayConditions.map(
				(condition: wire.WireConditionDefinition, index) => {
					const conditionPath = `${path}["conditions"]["${index}"]`
					const selected = selectedNode.startsWith(conditionPath)

					return (
						<PropNodeTag
							title={getConditionTitle(condition)}
							icon={"filter_list"}
							selected={selected}
							iconColor={primaryColor}
							key={index}
							onClick={() => {
								uesio.builder.setSelectedNode(
									"viewdef",
									viewDefId,
									conditionPath
								)
							}}
							popChildren
							context={context}
						>
							{
								<PropertiesPane
									path={conditionPath}
									index={0}
									context={context}
									propsDef={{
										title: "Condition",
										sections: [],
										defaultDefinition: () => ({}),
										properties:
											getConditionProperties(condition),
										actions: [
											{
												label: "Toggle Condition",
												type: "TOGGLE_CONDITION",
											},
										],
									}}
									valueAPI={valueAPI}
								/>
							}
						</PropNodeTag>
					)
				}
			)} */}
		</>
	)
}

export default ConditionalDisplaySection
