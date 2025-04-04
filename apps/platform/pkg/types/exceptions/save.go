package exceptions

func NewSaveException(recordID, fieldID, message string, err error) *SaveException {
	// We put the formatted message in here so that
	// Marshalling works out of the box.
	// The other option is a custom marshaller
	return &SaveException{
		RecordID: recordID,
		FieldID:  fieldID,
		Message:  printErr("", message, err),
		err:      err,
	}
}

type SaveException struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
	err      error
}

func (e *SaveException) Error() string {
	return e.Message
}

func (e *SaveException) Unwrap() error {
	return e.err
}
