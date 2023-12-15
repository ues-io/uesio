package wire

import (
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

func TestNewGenericSaveException(t *testing.T) {
	tests := []struct {
		name  string
		input error
		want  *exceptions.SaveException
	}{
		{
			"handle PG duplicate index errors on the Uesio data table",
			&pgconn.PgError{
				Code:    "23505",
				Message: "duplicate key value violates unique constraint \"unique_idx\"",
				Detail:  "Key (tenant, collection, uniquekey)=(site:uesio/studio:prod, uesio/studio.bundledependency, uesio/tests:dev:uesio/builder) already exists.",
			},
			&exceptions.SaveException{
				RecordID: "uesio/tests:dev:uesio/builder",
				FieldID:  UNIQUE_KEY_FIELD,
				Message:  "Unable to create duplicate uesio/studio.bundledependency record: uesio/tests:dev:uesio/builder",
			},
		},
		{
			"ignore other PG errors (for now - TODO handle more cases)",
			&pgconn.PgError{
				Code:    "111111111",
				Message: "some other ghastly thing",
			},
			&exceptions.SaveException{
				RecordID: "",
				FieldID:  "",
				Message:  ": some other ghastly thing (SQLSTATE 111111111)",
			},
		},
		{
			"wrap all errors by default",
			errors.New("explosion!"),
			&exceptions.SaveException{
				RecordID: "",
				FieldID:  "",
				Message:  "explosion!",
			},
		},
	}
	for _, tt := range tests {
		testName := "it should " + tt.name
		t.Run(testName, func(t *testing.T) {
			actual := NewGenericSaveException(tt.input)
			if !assert.ObjectsAreEqual(tt.want, actual) {
				assert.Fail(t, testName)
			}
		})
	}
}
