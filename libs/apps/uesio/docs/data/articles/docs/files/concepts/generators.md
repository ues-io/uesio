# Generators

ues.io generators enable to you to rapidly create new instances of metadata by defining named, parameterized templates which we call "generators". Each generator contains one or more files which comprise the various portions of different ues.io metadata types, and each of these files can contain merge variables which must be provided via generator parameters.

Generators can be invoked either via the ues.io CLI, with `uesio generate <generator_name>`, or via the Studio with special components that solicit parameters via a dialog and then allow the user to run the generator.
