package exceptions

type ExecutionException struct {
	msg string
}

func NewExecutionException(msg string) *ExecutionException {
	return &ExecutionException{msg}
}
func (e *ExecutionException) Error() string {
	return e.msg
}
