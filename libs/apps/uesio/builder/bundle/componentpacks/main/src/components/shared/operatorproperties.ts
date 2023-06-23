const EQ = {
	label: "Equals",
	value: "EQ",
}
const NOTEQ = {
	label: "Not Equals",
	value: "NOT_EQ",
}
const IN = {
	label: "In",
	value: "IN",
}
const NOTIN = {
	label: "Not In",
	value: "NOT_IN",
}
const BLANK = {
	label: "Is Blank",
	value: "IS_BLANK",
}
const NOTBLANK = {
	label: "Is Not Blank",
	value: "IS_NOT_BLANK",
}
const GT = {
	label: "Greater Than",
	value: "GT",
}
const LT = {
	label: "Less Than",
	value: "LT",
}
const GTE = {
	label: "Greater Than or Equal To",
	value: "GTE",
}
const LTE = {
	label: "Less Than or Equal To",
	value: "LTE",
}
const BETWEEN = {
	label: "Between",
	value: "BETWEEN",
}
const CONTAINS = {
	label: "Contains",
	value: "CONTAINS",
}
const STARTWITH = {
	label: "Starts With",
	value: "START_WITH",
}
const HASANY = {
	label: "Has Any",
	value: "HAS_ANY",
}
const HASALL = {
	label: "Has All",
	value: "HAS_ALL",
}

const EQNOTEQ = [EQ, NOTEQ]

const INNOTIN = [IN, NOTIN]

const GTLT = [GT, LT]

const GTELTE = [GTE, LTE]

const ANYHASALL = [HASANY, HASALL]

const BLANKNOTBLANK = [BLANK, NOTBLANK]

export {
	EQ,
	NOTEQ,
	IN,
	NOTIN,
	BLANK,
	NOTBLANK,
	GT,
	LT,
	GTE,
	LTE,
	BETWEEN,
	CONTAINS,
	STARTWITH,
	HASANY,
	HASALL,
	EQNOTEQ,
	INNOTIN,
	GTLT,
	GTELTE,
	ANYHASALL,
	BLANKNOTBLANK,
}
