package exceptions

type NotFoundException struct {
	msg string
}

func NewNotFoundException(msg string) *NotFoundException {
	return &NotFoundException{msg}
}
func (e *NotFoundException) Error() string {
	return e.msg
}
