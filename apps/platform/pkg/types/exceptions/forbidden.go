package exceptions

type ForbiddenException struct {
	msg string
}

func NewForbiddenException(msg string) *ForbiddenException {
	return &ForbiddenException{msg}
}
func (e *ForbiddenException) Error() string {
	return e.msg
}
