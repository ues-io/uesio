package exceptions

func NewLoadException(error error) *LoadException {
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
