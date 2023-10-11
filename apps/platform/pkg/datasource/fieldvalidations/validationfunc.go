package fieldvalidations

import "github.com/thecloudmasters/uesio/pkg/adapt"

type ValidationFunc func(change *adapt.ChangeItem) *adapt.SaveError
