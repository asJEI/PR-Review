export type SemanticChangeType = "added" | "removed" | "modified";

export interface SemanticFunction {
  name: string;
  changeType: SemanticChangeType;
  scope?: string;
  line?: number;
  isAsync?: boolean;
}

export interface SemanticClass {
  name: string;
  changeType: SemanticChangeType;
  line?: number;
}

export interface SemanticInterface {
  name: string;
  changeType: SemanticChangeType;
  kind: "interface" | "type";
  line?: number;
}

export interface ModuleChanges {
  added: string[];
  removed: string[];
}

export interface SemanticAnalysis {
  functions: SemanticFunction[];
  classes: SemanticClass[];
  imports: ModuleChanges;
  exports: ModuleChanges;
  interfaces: SemanticInterface[];
  asyncChanges: boolean;
}

export const EMPTY_SEMANTIC_ANALYSIS: SemanticAnalysis = {
  functions: [],
  classes: [],
  imports: { added: [], removed: [] },
  exports: { added: [], removed: [] },
  interfaces: [],
  asyncChanges: false,
};
