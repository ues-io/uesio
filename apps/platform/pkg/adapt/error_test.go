package adapt

import (
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestNewGenericSaveError(t *testing.T) {
	tests := []struct {
		name           string
		input          error
		wantErrMessage string
	}{
		{
			"handle PG duplicate index errors on the Uesio data table",
			&pgconn.PgError{
				Code:    "23505",
				Message: "duplicate key value violates unique constraint \"unique_idx\"",
			},
			"Unable to create duplicate record",
		},
		{
			"ignore other PG errors (for now - TODO handle more cases)",
			&pgconn.PgError{
				Code:    "111111111",
				Message: "some other ghastly thing",
			},
			": some other ghastly thing (SQLSTATE 111111111)",
		},
		{
			"wrap all errors by default",
			errors.New("explosion!"),
			"explosion!",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			actual := NewGenericSaveError(tt.input)
			assert.Equalf(t, tt.wantErrMessage, actual.Error(), "NewGenericSaveError(%v)", tt.input)
		})
	}
}
