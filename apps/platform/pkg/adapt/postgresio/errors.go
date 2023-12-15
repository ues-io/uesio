package postgresio

import (
	"strings"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

// TranslatePGError handles PGException cases and translates them into appropriate Uesio exception types
func TranslatePGError(err error) error {
	switch typedVal := err.(type) {
	case *pgconn.PgError:
		switch typedVal.Code {
		case "22P02":
			// invalid input syntax
			return exceptions.NewBadRequestException(typedVal.Message)
		}
	default:
		msg := err.Error()
		if strings.Contains(msg, "failed to encode") || strings.Contains(msg, "failed to decode") {
			return exceptions.NewBadRequestException(msg)
		}
	}
	return err
}
