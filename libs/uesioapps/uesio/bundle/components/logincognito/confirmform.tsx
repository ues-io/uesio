import { material } from "@uesio/ui"
import React, {
	FunctionComponent,
	useState,
	ChangeEvent,
	Dispatch,
	SetStateAction,
} from "react"
import { useLoginStyles } from "./logincognito"

type ConfirmFormProps = {
	setMode: Dispatch<SetStateAction<string>>
	confirm: (verificationCode: string) => Promise<void>
}

const ConfirmForm: FunctionComponent<ConfirmFormProps> = ({
	setMode,
	confirm,
}) => {
	const classes = useLoginStyles()
	const [verificationCode, setVerificationCode] = useState("")

	return (
		<>
			<material.TextField
				label="Verification Code"
				variant="outlined"
				type="password"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setVerificationCode(e.target.value)
				}
			/>
			<material.Button
				onClick={() => setMode("")}
				className={classes.button}
			>
				Back to Signup
			</material.Button>
			<material.Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => {
					confirm(verificationCode)
				}}
			>
				Confirm
			</material.Button>
			<div>
				<material.Typography variant="body2" component="span">
					Lost your code?&nbsp;
				</material.Typography>
				<material.Link
					component="span"
					variant="body2"
					onClick={() => console.info("I'm a button.")}
				>
					Resend code
				</material.Link>
			</div>
		</>
	)
}

export default ConfirmForm
