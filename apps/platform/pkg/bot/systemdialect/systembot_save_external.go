package systemdialect

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runUesioExternalSaveBot(op *wire.SaveOp, connection wire.Connection, session *sess.Session) error {
	return errors.New("uesio external save not yet supported")
}
