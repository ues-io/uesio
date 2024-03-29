package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ValidationFunc func(change *wire.ChangeItem) *exceptions.SaveException
