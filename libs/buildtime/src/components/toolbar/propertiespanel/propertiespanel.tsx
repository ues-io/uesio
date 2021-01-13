import React, { FunctionComponent } from "react"
import ToolbarTitle from "../toolbartitle"
import { definition, hooks, builder } from "@uesio/ui"
import BuildPropArea from "../../buildproparea/buildproparea"
import CloseIcon from "@material-ui/icons/Close"
import { makeStyles, createStyles } from "@material-ui/core"
import BuildActionsArea from "../../buildproparea/buildactionsarea"

const useStyles = makeStyles(() =>
	createStyles({
		notFound: {
			display: "flex",
			alignContent: "center",
			alignItems: "center",
			height: "100%",
			textAlign: "center",
			fontSize: "9pt",
		},
		notFoundInner: {
			color: "#444",
			padding: "40px",
		},
	})
)

interface Props extends definition.BaseProps {
	propDef?: builder.BuildPropertiesDefinition | null
	definition?: definition.DefinitionMap
}

const PropertiesPanel: FunctionComponent<Props> = (props) => {
	const { path, propDef, definition, context } = props
	// Get the property descriptor from the path
	const uesio = hooks.useUesio(props)
	const classes = useStyles()

	if (propDef && definition !== undefined) {
		return (
			<>
				<ToolbarTitle
					title={propDef.title}
					icon={CloseIcon}
					iconOnClick={(): void => uesio.builder.setPanelClosed()}
				/>
				<BuildPropArea
					index={0}
					buildPropsDef={propDef}
					definition={definition}
					path={path}
					context={context}
				/>
				<BuildActionsArea
					index={0}
					actions={propDef.actions}
					definition={definition}
					path={path}
					context={context}
				/>
			</>
		)
	} else if (!propDef && !definition) {
		return (
			<ToolbarTitle
				title="Nothing selected"
				icon={CloseIcon}
				iconOnClick={(): void => uesio.builder.setPanelClosed()}
			/>
		)
	}
	return (
		<div className={classes.notFound}>
			<div className={classes.notFoundInner}>
				No Properties Definition Found for this Component
				<br />
				{path}
			</div>
		</div>
	)
}

export default PropertiesPanel
