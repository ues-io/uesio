package wire

import (
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

const uesioUniqueKeyDupDetailPrefix = "Key (tenant, collection, uniquekey)=("
const uesioUniqueKeyDupDetailSuffix = ") already exists."
const uesioUniqueKeyDupIdxMessage = "duplicate key value violates unique constraint \"unique_idx\""
const formattedUesioDupError = "Unable to create duplicate %s record: %s"

func NewGenericSaveException(err error) *exceptions.SaveException {
	if pgError, ok := err.(*pgconn.PgError); ok {
		// Handle Postgres duplicate key constraints
		if pgError.Code == "23505" && pgError.Message == uesioUniqueKeyDupIdxMessage && strings.HasPrefix(pgError.Detail, uesioUniqueKeyDupDetailPrefix) {
			// Example detail:
			// Key (tenant, collection, uniquekey)=(site:uesio/studio:prod, uesio/studio.bundledependency, uesio/tests:dev:uesio/builder) already exists.
			parts := strings.Split(strings.TrimSuffix(strings.Trim(pgError.Detail, uesioUniqueKeyDupDetailPrefix), uesioUniqueKeyDupDetailSuffix), ", ")
			recordID := parts[2]
			return exceptions.NewSaveException(recordID, commonfields.UniqueKey, fmt.Sprintf(formattedUesioDupError, parts[1], recordID))
		}
	}
	return exceptions.NewSaveExceptionForError("", "", err)
}
