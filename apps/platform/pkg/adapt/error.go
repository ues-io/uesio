package adapt

import (
	"fmt"
	"github.com/jackc/pgx/v5/pgconn"
	"strings"
)

type SaveError struct {
	RecordID string `json:"recordid"`
	FieldID  string `json:"fieldid"`
	Message  string `json:"message"`
}

func (se *SaveError) Error() string {
	return se.Message
}

const uesioUniqueKeyDupDetailPrefix = "Key (tenant, collection, uniquekey)=("
const uesioUniqueKeyDupDetailSuffix = ") already exists."
const uesioUniqueKeyDupIdxMessage = "duplicate key value violates unique constraint \"unique_idx\""
const formattedUesioDupError = "Unable to create duplicate %s record: %s"

func NewGenericSaveError(err error) *SaveError {
	if pgError, ok := err.(*pgconn.PgError); ok {
		// Handle Postgres duplicate key constraints
		if pgError.Code == "23505" && pgError.Message == uesioUniqueKeyDupIdxMessage && strings.HasPrefix(pgError.Detail, uesioUniqueKeyDupDetailPrefix) {
			// Example detail:
			// Key (tenant, collection, uniquekey)=(site:uesio/studio:prod, uesio/studio.bundledependency, uesio/tests:dev:uesio/builder) already exists.
			parts := strings.Split(strings.TrimSuffix(strings.Trim(pgError.Detail, uesioUniqueKeyDupDetailPrefix), uesioUniqueKeyDupDetailSuffix), ", ")
			recordID := parts[2]
			return &SaveError{
				RecordID: recordID,
				FieldID:  UNIQUE_KEY_FIELD,
				Message:  fmt.Sprintf(formattedUesioDupError, parts[1], recordID),
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
