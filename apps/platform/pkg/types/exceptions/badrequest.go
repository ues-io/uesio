package exceptions

import "fmt"

type BadRequestException struct {
	message string
	err     error
}

const BAD_REQUEST_PREFIX = "bad request:"

func NewBadRequestException(message string, err error) *BadRequestException {
	return &BadRequestException{message, err}
}

func (e *BadRequestException) Error() string {
	// TODO: Add the Bad Request Prefix but keeping out for now,
	// so we don't break a bunch of tests
	// return fmt.Sprintf("Bad Request: %v", e.err)
	if e.message != "" && e.err != nil {
		return fmt.Sprintf("%s %s: %v", BAD_REQUEST_PREFIX, e.message, e.err)
	}
	if e.err != nil {
		return fmt.Sprintf("%s %v", BAD_REQUEST_PREFIX, e.err)
	}
	return fmt.Sprintf("%s %s", BAD_REQUEST_PREFIX, e.message)
}

func (e *BadRequestException) Unwrap() error {
	return e.err
}
