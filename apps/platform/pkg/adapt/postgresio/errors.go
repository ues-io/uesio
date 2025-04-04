package postgresio

import (
	"errors"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

// TranslatePGError handles PGException cases and translates them into appropriate Uesio exception types
func TranslatePGError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "22P02":
			// invalid input syntax
			// We're intentionally hiding the details of the error
			// for example: pgErr.Severity and pgErr.Code
			return exceptions.NewBadRequestException(pgErr.Message, nil)
		}
	}

	msg := err.Error()
	if strings.Contains(msg, "failed to encode") || strings.Contains(msg, "failed to decode") {
		return exceptions.NewBadRequestException(msg, nil)
	}
	return err
}
