import { Action } from "../../utility/lab.actionsbar/actionsbardefinition"
const actions = (wireId: string): Action[] => [
	{
		name: "save",
		signals: [
			{ signal: "wire/SAVE", wires: [wireId] },
			{
				signal: "notification/ADD",
				text: "saved",
			},
			{ signal: "wire/EMPTY", wireId },
			{ signal: "wire/CREATE_RECORD", wireId },
		],
	},
	{
		name: "cancel",
		signals: [{ signal: "wire/CANCEL", wireId }],
	},
]

export const actionTypes = actions("").map((x) => x.name)

export default actions
