# DNA Inheritance Integration (Assegna DNA ereditato)

Bounty #81 -- integration with the #79 DNA schema.

## How DNA inheritance works

The `assignInheritedDNA` function takes the mother robot's DNA profile and creates an inherited DNA profile for the child:
- **traits**: copied from the mother (the child inherits all hereditary traits)
- **mutations**: empty (the child starts with zero mutations; mutations accumulate over the child's lifecycle)
- **parentDNA**: the mother's parentDNA (the grandmother's DNA hash, for genealogical tracing)
- **sourceDNA**: "mother" (indicating the DNA was inherited from the mother, not a mutation or external source)

## Compatibility with #79

The #79 DNA kit defined a robot DNA schema with `traits`, `mutations`, `parentDNA`, and `genealogyTree` fields. The auto-config kit's `assignInheritedDNA` produces records compatible with the #79 schema, so a child configured by this kit can be traced through the #79 genealogy tree.
