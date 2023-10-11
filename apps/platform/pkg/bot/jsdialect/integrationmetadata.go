package jsdialect

import "github.com/thecloudmasters/uesio/pkg/meta"

type IntegrationMetadata meta.Integration

func (im *IntegrationMetadata) GetBaseURL() string {
	return im.BaseURL
}
