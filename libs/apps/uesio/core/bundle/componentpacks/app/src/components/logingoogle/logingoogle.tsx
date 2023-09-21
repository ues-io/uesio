import { component, definition } from "@uesio/ui"

const LoginGoogle: definition.UC = ({ context, definition }) => {
	const LoginGoogleUtility = component.getUtility("uesio/core.logingoogle")
	return <LoginGoogleUtility context={context} mode={definition.mode} />
}

export default LoginGoogle
