import React, { FC, useState } from "react"
import { SectionRendererProps } from "../sectionrendererdefinition"
import ExpandPanel from "../../expandpanel"
import { builder, styles } from "@uesio/ui"
import PropNodeTag from "../../buildpropitem/propnodetag"
import PropertiesPane from "../../propertiespane"
import conditionProperties from "./conditionProperties"
import Condition from "./conditiontypes"

const ConditionalDisplaySection: FC<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection
	const [selectedCondition, setSelectedCondition] = useState<number | null>(
		null
	)
	const classes = styles.useStyles(
		{
			root: {},
			conditionProp: {
				padding: "8px",
			},
		},
		props
	)

	const conditions =
		(valueAPI.get(`${path}["uesio.display"]`) as Condition[]) || []

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		>
			{!!conditions.length &&
				conditions.map((c, index) => (
					<PropNodeTag
						title={Object.values(c)
							.filter((el) => el)
							.join(" | ")}
						icon={"filter_list"}
						selected={selectedCondition === index}
						key={index}
						onClick={() => {
							setSelectedCondition(index)
						}}
						popChildren
						context={context}
					>
						<PropertiesPane
							path={`${props.path}['uesio.display'][${index}]`}
							index={0}
							context={context}
							propsDef={{
								title: "Condition",
								sections: [],
								defaultDefinition: () => ({}),
								properties: conditionProperties,
							}}
							valueAPI={valueAPI}
						/>
					</PropNodeTag>
				))}
			<PropNodeTag
				title={"Add Condition"}
				icon={"filter_list"}
				onClick={() => {
					valueAPI.add(`${path}["uesio.display"]`, {
						type: "null",
					})
					setSelectedCondition(conditions.length)
				}}
				popChildren
				context={context}
			/>
		</ExpandPanel>
	)
}

export default ConditionalDisplaySection
