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

func Test_writeAllowedRoutePaths(t *testing.T) {
	tests := []struct {
		name         string
		publicRoutes map[string]bool
		homeRoute    *meta.Route
		wantOutput   string
	}{
		{
			"no routes",
			map[string]bool{},
			nil,
			"",
		},
		{
			"should return an Allow entry for each path, in stable alphabetical order",
			map[string]bool{
				"/foo":     true,
				"/bar/baz": true,
			},
			nil,
			`
Allow: /bar/baz
Allow: /foo`,
		},
		{
			"should allow access to / for the home route, if defined",
			map[string]bool{
				"/home":    true,
				"/foo":     true,
				"/bar/baz": true,
			},
			&meta.Route{
				Path: "home",
			},
			`
Allow: /bar/baz
Allow: /foo
Allow: /home
Allow: /$`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buffer := bytes.NewBuffer([]byte{})
			writeAllowedRoutePaths(buffer, tt.publicRoutes, tt.homeRoute)
			assert.Equal(t, tt.wantOutput, string(buffer.Bytes()))
		})
	}
}

func Test_getPublicFilePaths(t *testing.T) {

	contextSite := &meta.Site{
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: "luigi/pasta",
			},
		},
	}

	tests := []struct {
		name  string
		files meta.FileCollection
		site  *meta.Site
		want  map[string]bool
	}{
		{
			"no static files",
			meta.FileCollection{},
			contextSite,
			map[string]bool{},
		},
		{
			"it should add all static files",
			meta.FileCollection{
				&meta.File{
					BundleableBase: meta.BundleableBase{
						Namespace: "luigi/pasta",
						Name:      "foo",
					},
				},
				&meta.File{
					BundleableBase: meta.BundleableBase{
						Namespace: "luigi/pasta",
						Name:      "bar",
					},
				},
			},
			contextSite,
			map[string]bool{
				"/site/files/luigi/pasta/*/bar": true,
				"/site/files/luigi/pasta/*/foo": true,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, getPublicFilePaths(tt.files, tt.site), "getPublicFilePaths(%v)", tt.files)
		})
	}
}

func Test_writeAllowedStaticFiles(t *testing.T) {

	tests := []struct {
		name       string
		files      map[string]bool
		wantOutput string
	}{
		{
			"no files",
			map[string]bool{},
			"",
		},
		{
			"should return an Allow entry for each file, in stable alphabetical order",
			map[string]bool{
				"/site/files/luigi/pasta/*/bar": true,
				"/site/files/luigi/pasta/*/foo": true,
			},
			`
Allow: /site/files/luigi/pasta/*/bar
Allow: /site/files/luigi/pasta/*/foo`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			buffer := bytes.NewBuffer([]byte{})
			writeAllowedStaticFiles(buffer, tt.files)
			assert.Equal(t, tt.wantOutput, string(buffer.Bytes()))
		})
	}
}

func Test_writeAllowedCorePaths(t *testing.T) {

	b := bytes.Buffer{}
	expected := `
Allow: /static/vendor/*
Allow: /*/static/ui/*
Allow: /favicon.ico
Allow: /site/componentpacks/*`

	t.Run("test allowed core paths", func(t *testing.T) {
		writeAllowedCorePaths(&b)
		assert.Equal(t, expected, string(b.Bytes()))
	})
}
