package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestCacheControl(t *testing.T) {
	w := httptest.NewRecorder()
	r, _ := http.NewRequest("POST", "http://example.com/foo", nil)
	handler := func(w http.ResponseWriter, r *http.Request) {}
	opts := []optionFunc{MaxAge(time.Hour * 24 * 13), NoTransform()}
	cached := Cached(http.HandlerFunc(handler), opts...)

	cached.ServeHTTP(w, r)

	wanted := "no-transform, max-age=1123200"
	if pragmas := w.Header().Get("Cache-Control"); pragmas != wanted {
		t.Fatalf("Cache-Control header: got %s, wanted '%s'", pragmas, wanted)
	}
}

var cacheOptionTests = []struct {
	o CacheOptions
	h string
}{
	{CacheOptions{Immutable: true, NoTransform: true}, "no-transform, max-age=31536000"},
	{CacheOptions{Private: true, NoTransform: true}, "private, no-transform"},
	{CacheOptions{MaxAge: time.Hour * 24 * 13, NoTransform: true}, "no-transform, max-age=1123200"},
	{CacheOptions{NoCache: true, NoTransform: true}, "no-cache, no-transform"},
	{CacheOptions{NoStore: true, NoTransform: true}, "no-store, no-transform"},
	{CacheOptions{NoTransform: false}, ""},
	{CacheOptions{MustRevalidate: true, NoTransform: true}, "no-transform, must-revalidate"},
	{CacheOptions{ProxyRevalidate: true, NoTransform: true}, "no-transform, proxy-revalidate"},
	{CacheOptions{SharedMaxAge: time.Hour * 13, NoTransform: true}, "no-transform, s-maxage=46800"},
}

func TestCacheOptions(t *testing.T) {
	for _, tt := range cacheOptionTests {
		if o := tt.o.String(); tt.h != o {
			t.Errorf("%#v got '%s', wanted '%s'", tt.o, o, tt.h)
		}
	}
}

var cacheOptionFuncTests = []struct {
	f optionFunc
	h string
}{
	{Immutable(), "max-age=31536000"},
	{Private(), "private"},
	{MaxAge(time.Hour * 24 * 13), "max-age=1123200"},
	{NoCache(), "no-cache"},
	{NoStore(), "no-store"},
	{MustRevalidate(), "must-revalidate"},
	{ProxyRevalidate(), "proxy-revalidate"},
	{SharedMaxAge(time.Hour * 13), "s-maxage=46800"},
	{Config(CacheOptions{MaxAge: time.Hour * 24 * 13, NoTransform: true}), "no-transform, max-age=1123200"},
}

func TestOptionFuncs(t *testing.T) {
	for _, tt := range cacheOptionFuncTests {
		co := CacheOptions{}
		tt.f(&co)
		if msg := co.String(); tt.h != msg {
			t.Errorf("got '%s', wanted '%s'", msg, tt.h)
		}
	}
}

func TestMaintainsExistingCacheOptions(t *testing.T) {
	w := httptest.NewRecorder()
	r, _ := http.NewRequest("POST", "http://example.com/foo", nil)
	handler := func(w http.ResponseWriter, r *http.Request) { w.Header().Set("Cache-Control", "must-revalidate") }
	opts := []optionFunc{MaxAge(time.Hour * 24 * 13), NoTransform()}
	cached := Cached(http.HandlerFunc(handler), opts...)

	cached.ServeHTTP(w, r)

	wanted := "must-revalidate"
	if pragmas := w.Header().Get("Cache-Control"); pragmas != wanted {
		t.Fatalf("Cache-Control header: got %s, wanted '%s'", pragmas, wanted)
	}
}
