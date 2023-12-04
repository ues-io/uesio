package exceptions

import "fmt"

type InvalidParamException struct {
	Message string
	Param   string
}

func (e *InvalidParamException) Error() string {
	return fmt.Sprintf("%s: %s", e.Message, e.Param)
}

func NewInvalidParamException(message string, param string) error {
	return &InvalidParamException{Param: param, Message: message}
}
