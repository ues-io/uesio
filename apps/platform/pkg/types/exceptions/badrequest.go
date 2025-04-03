package exceptions

type BadRequestException struct {
	err error
}

func NewBadRequestException(err error) *BadRequestException {
	return &BadRequestException{err}
}

func (e *BadRequestException) Error() string {
	// TODO: Add the Bad Request Prefix but keeping out for now,
	// so we don't break a bunch of tests
	// return fmt.Sprintf("Bad Request: %v", e.err)
	return e.err.Error()
}

func (e *BadRequestException) Unwrap() error {
	return e.err
}
