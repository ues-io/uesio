package controller

import (
	"bytes"
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"testing"
)

func Test_getPublicRoutePaths(t *testing.T) {
	tests := []struct {
		name   string
		routes meta.RouteCollection
		want   map[string]bool
	}{
		{
			"no routes",
			meta.RouteCollection{},
			map[string]bool{},
		},
		{
			"it should deduplicate routes and prefix with /",
			meta.RouteCollection{
				&meta.Route{Path: "foo"},
				&meta.Route{Path: "bar"},
				&meta.Route{Path: "/bar"},
				&meta.Route{Path: "/baz/{bazid}/details/{otherid}"},
				&meta.Route{Path: "baz/{bazid}/edit"},
			},
			map[string]bool{
				"/foo":  true,
				"/bar":  true,
				"/baz/": true,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, getPublicRoutePaths(tt.routes), "getPublicRoutePaths(%v)", tt.routes)
		})
	}
}

func Test_writeAllowPaths(t *testing.T) {
	tests := []struct {
		name         string
		publicRoutes map[string]bool
		wantOutput   string
	}{
		{
			"no routes",
			map[string]bool{},
			"",
		},
		{
			"should return an Allow entry for each path, in stable alphabetical order",
			map[string]bool{
				"/foo":     true,
				"/bar/baz": true,
			},
			`
Allow: /bar/baz
Allow: /foo`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buffer := bytes.NewBuffer([]byte{})
			writeAllowPaths(buffer, tt.publicRoutes)
			assert.Equal(t, string(buffer.Bytes()), tt.wantOutput)
		})
	}
}
