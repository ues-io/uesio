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
			return exceptions.NewBadRequestException(pgErr.Message)
		}
	}

	msg := err.Error()
	if strings.Contains(msg, "failed to encode") || strings.Contains(msg, "failed to decode") {
		return exceptions.NewBadRequestException(msg)
	}
	return err
}
