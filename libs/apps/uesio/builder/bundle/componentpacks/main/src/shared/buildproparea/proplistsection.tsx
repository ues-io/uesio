import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder } from "@uesio/ui"
import PropList from "../../utilities/proplist/proplist"

const PropListSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, propsDef } = props
	const section = props.section as builder.PropListSection

	return (
		<>
			{section.properties && (
				<PropList
					path={path}
					propsDef={propsDef}
					properties={section.properties}
					context={context}
				/>
			)}
		</>
	)
}

export default PropListSection
