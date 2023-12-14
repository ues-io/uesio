package exceptions

func NewSaveException(recordID string, fieldID, message string) *SaveException {
	return &SaveException{
		RecordID: recordID,
		FieldID:  fieldID,
		Message:  message,
	}
}

type SaveException struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
}

func (se *SaveException) Error() string {
	return se.Message
}
