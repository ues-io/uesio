package exceptions

type BadRequestException struct {
	msg string
}

func NewBadRequestException(msg string) *BadRequestException {
	return &BadRequestException{msg}
}
func (e *BadRequestException) Error() string {
	return e.msg
}
