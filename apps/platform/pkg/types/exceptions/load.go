package exceptions

func NewLoadException(message string) *LoadException {
	return &LoadException{
		Message: message,
		error:   NewBadRequestException(message),
	}
}

func NewLoadExceptionForError(error error) *LoadException {
	return &LoadException{
		Message: error.Error(),
		error:   error,
	}
}

type LoadException struct {
	Message string `json:"message"`
	error   error
}

func (se *LoadException) Error() string {
	message := se.Message
	if se.error != nil {
		message = se.error.Error()
	}
	return message
}

func (se *LoadException) GoError() error {
	if se.error != nil {
		return se.error
	}
	return NewBadRequestException(se.Error())
}
