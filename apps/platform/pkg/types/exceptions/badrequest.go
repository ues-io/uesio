package exceptions

type BadRequestException BaseException

func NewBadRequestException(message string, err error) *BadRequestException {
	return &BadRequestException{message, err}
}

func (e *BadRequestException) Error() string {
	return printErr("bad request:", e.message, e.err)
}

func (e *BadRequestException) Unwrap() error {
	return e.err
}
