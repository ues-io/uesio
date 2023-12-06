package fieldvalidations

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ValidationFunc func(change *wire.ChangeItem) *wire.SaveError
