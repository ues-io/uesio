package exceptions

import "fmt"

type InvalidParamException struct {
	Message string
	Param   string
	Details string
}

func (e *InvalidParamException) Error() string {
	return fmt.Sprintf("%s: %s", e.Message, e.Param)
}

func NewInvalidParamException(message string, param string) error {
	return &InvalidParamException{Param: param, Message: message}
}

func NewInvalidParamExceptionWithDetails(message, param, details string) error {
	return &InvalidParamException{Param: param, Message: message, Details: details}
}
