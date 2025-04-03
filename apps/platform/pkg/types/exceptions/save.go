package exceptions

func NewSaveException(recordID, fieldID string, error error) *SaveException {
	return &SaveException{
		RecordID: recordID,
		FieldID:  fieldID,
		Message:  error.Error(),
		error:    error,
	}
}

type SaveException struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
	error    error
}

func (se *SaveException) Error() string {
	message := se.Message
	if se.error != nil {
		message = se.error.Error()
	}
	return message
}
