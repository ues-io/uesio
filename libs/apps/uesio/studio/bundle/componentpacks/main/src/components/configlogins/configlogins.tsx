import { FunctionComponent } from "react"
import { component, definition, hooks } from "@uesio/ui"

type ConfigLoginsDefinition = {
	user: string
	email: string
	requery: string
}
interface Props extends definition.BaseProps {
	definition: ConfigLoginsDefinition
}

const TitleBar = component.getUtility("uesio/io.titlebar")
const Button = component.getUtility("uesio/io.button")

const ConfigLogins: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition } = props
	const user = definition?.user ? context.merge(definition?.user) : ""
	const email = definition?.email ? context.merge(definition?.email) : ""
	const requeryWire = definition.requery

	const siteadmin = context.getSiteAdmin()

	if (!siteadmin) {
		throw new Error("Must provide either siteadmin context")
	}

	const [signupmethods] = uesio.builder.useMetadataList(
		context,
		"SIGNUPMETHOD",
		""
	)

	if (!signupmethods) {
		return null
	}

	const createLogin = async (key: string) => {
		uesio.signal.runMany(
			[
				{
					signal: "user/CREATE_LOGIN",
					signupMethod: key,
					payload: {
						username: user,
						email,
					},
					onerror: {
						continue: false,
						notify: true,
						signals: [
							{
								signal: "notification/ADD_ERRORS",
							},
						],
					},
				},
				{
					signal: "wire/LOAD",
					wires: [requeryWire],
				},
				{
					signal: "notification/ADD",
					text: "An email has been sent to the user!",
					details: "new password can be inserted",
					severity: "success",
				},
			],
			context
		)
	}

	const resetPassword = async (key: string) => {
		uesio.signal.runMany(
			[
				{
					signal: "user/FORGOT_PASSWORD",
					signupMethod: key,
					payload: {
						username: user,
					},
					onerror: {
						continue: false,
						notify: true,
						signals: [
							{
								signal: "notification/ADD_ERRORS",
							},
						],
					},
				},
				{
					signal: "notification/ADD",
					text: "An email has been sent to the user!",
					details: "Now the password can be changed",
					severity: "success",
				},
			],
			context
		)
	}


	const signupmethodsKeys = Object.keys(signupmethods || {})

	return (
		<>
			{signupmethodsKeys?.map((key, i) => (
				<TitleBar
					key={`${key}.${i}`}
					title={key}
					context={context}
					styles={{
						root: {
							marginBottom: "20px",
						},
					}}
					actions={
						<>
							<Button
								context={context}
								variant="uesio/io.nav"
								label="Create Method"
								onClick={() => {
									createLogin(key)
								}}
							/>
							<Button
							context={context}
							variant="uesio/io.nav"
							label="Reset Password"
							onClick={() => {
								resetPassword(key)
							}}/>
						</>
					}
				/>
			))}
		</>
	)
}

export default ConfigLogins
