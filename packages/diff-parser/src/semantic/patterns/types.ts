export interface PatternSet {
  function: RegExp[];
  class: RegExp[];
  interface: RegExp[];
  typeAlias: RegExp[];
  import: RegExp[];
  export: RegExp[];
}
