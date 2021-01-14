const MODE = {
	READ: "READ",
	EDIT: "EDIT",
}

type FieldMode = keyof typeof MODE

export { MODE, FieldMode }
