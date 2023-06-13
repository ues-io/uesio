package adapt

import "github.com/jackc/pgx/v5/pgconn"

type SaveError struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
}

func (se *SaveError) Error() string {
	return se.Message
}

func NewGenericSaveError(err error) *SaveError {
	if pgError, ok := err.(*pgconn.PgError); ok {
		// Handle Postgres duplicate key constraints
		if pgError.Code == "23505" && pgError.Message == "duplicate key value violates unique constraint \"unique_idx\"" {
			return &SaveError{
				RecordID: "",
				FieldID:  "",
				Message:  "Unable to create duplicate record",
			}
		}
	}
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
