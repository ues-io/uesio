// Copyright 2023 Zach McElrath

/*
Package yptr is a JSONPointer implementation that can walk through a yaml.Node tree.

yaml.Nodes preserve comments and locations in the source and can be useful to implement editing in-place
functionality that uses JSONPointer to locate the fields to be edited.

It also implements a simple extension to the JSONPointers standard that handles pointers into k8s manifests
which usually contain arrays whose elements are objects with a field that uniquely specifies the array entry
(e.g. "name").

For example, given a JSON/YAML input document:

	{"a": [{"k":"x", "v": 42}, {"k":"y", "v": 77}]}

If "k" is a field that contains a key that uniquiely identifies an element in a given array,
we can select the node with the scalar 42 by first selecting the array element for which "k"
has the value of "x", and then by walking to the field "v":

	/a/~{"k":"x"}/v

The "~" token accepts an argument which is interpreted as JSON value to be used as "query-by-example" filter
against elements of an array.
The array element is selected if the query-by-example object is a (recursive) subset of the element.

The ~{...} extension can potentially locate multiple matches. For example, "~{}" effectively acts as a wildcard.
This library offers the following APIs:
  - `FindAll`: retrieve multiple matches
  - `FindAllStrict`: retrieve multiple matches, but error if any paths are not found while traversing
  - `Find`: fetch only one match, and error if multiple matches are found

JSONPointer is designed to locate exactly one node in the tree. This can be achieved only if the effective
schema of the JSON/YAML document mandates that there is an identifying key in each array element you want to point to.
Using the "Find" function effectively performs a dynamic check of that invariant.
*/
package yptr
