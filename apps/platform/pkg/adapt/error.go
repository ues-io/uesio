package adapt

type SaveError struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
}

func (se *SaveError) Error() string {
	return se.Message
}

func NewGenericSaveError(err error) *SaveError {
	return &SaveError{
		RecordID: "",
		FieldID:  "",
		Message:  err.Error(),
	}
}

func NewSaveError(recordID string, fieldID, message string) *SaveError {
	return &SaveError{
		RecordID: recordID,
		FieldID:  fieldID,
		Message:  message,
	}
}
