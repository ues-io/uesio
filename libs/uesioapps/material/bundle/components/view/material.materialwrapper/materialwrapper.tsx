import { FunctionComponent } from "react"
import { MaterialWrapperProps } from "./materialwrapperdefinition"
import { component, styles } from "@uesio/ui"
import { PaletteOptions } from "@material-ui/core/styles/createPalette"
import * as material from "@material-ui/core"
import ScopedCssBaseline from "@material-ui/core/ScopedCssBaseline"

const makePaletteTheme = (theme: styles.ThemeState): PaletteOptions =>
	Object.entries(theme?.definition?.palette || {}).reduce(
		(acc, [label, color]) => ({
			...acc,
			[label]: { main: color },
		}),
		{}
	)
const makeTheme = (theme: styles.ThemeState) => {
	const themePalette = makePaletteTheme(theme)
	return material.createMuiTheme({
		palette: { ...themePalette },
		spacing: theme.definition.spacing,
	})
}
const Materialwrapper: FunctionComponent<MaterialWrapperProps> = (props) => (
	<material.ThemeProvider theme={makeTheme(props.context.getTheme())}>
		<ScopedCssBaseline>
			<component.Slot
				definition={props.definition}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context}
			/>
		</ScopedCssBaseline>
	</material.ThemeProvider>
)

export default Materialwrapper
