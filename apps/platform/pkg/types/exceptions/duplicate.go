package exceptions

type DuplicateException struct {
	msg string
}

func NewDuplicateException(msg string) *DuplicateException {
	return &DuplicateException{msg}
}
func (e *DuplicateException) Error() string {
	return e.msg
}
