package exceptions

type SystemBotNotFoundException struct {
}

func NewSystemBotNotFoundException() *SystemBotNotFoundException {
	return &SystemBotNotFoundException{}
}

func (e *SystemBotNotFoundException) Error() string {
	return "System Bot Not Found"
}
