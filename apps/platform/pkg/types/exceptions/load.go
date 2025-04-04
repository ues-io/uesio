package exceptions

func NewLoadException(message string, err error) *LoadException {
	// We put the formatted message in here so that
	// Marshalling works out of the box.
	// The other option is a custom marshaller
	return &LoadException{printErr("", message, err), err}
}

type LoadException struct {
	Message string `json:"message"`
	err     error
}

func (e *LoadException) Error() string {
	return e.Message
}

func (e *LoadException) Unwrap() error {
	return e.err
}
