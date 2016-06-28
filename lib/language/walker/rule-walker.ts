import * as ts from 'typescript';
import {IDisabledInterval, IOptions, Fix, RuleFailure, FailureHook} from '../rule';
import {doesIntersect} from '../utils';
import {SyntaxWalker} from './syntax-walker';

export class RuleWalker extends SyntaxWalker {
  private limit: number;
  private position: number;
  private options: any[];
  private matches: RuleFailure[];
  private disabledIntervals: IDisabledInterval[];
  private ruleName: string;

  constructor(private sourceFile: ts.SourceFile, options: IOptions, private hook: FailureHook = null) {
    super();

    this.position = 0;
    this.matches = [];
    this.options = options.ruleArguments;
    this.sourceFile = sourceFile;
    this.limit = this.sourceFile.getFullWidth();
    this.disabledIntervals = options.disabledIntervals;
    this.ruleName = options.ruleName;
  }

  public walk(node: ts.Node = this.getSourceFile()) {
    super.walk(node);
  }

  public getSourceFile(): ts.SourceFile {
    return this.sourceFile;
  }

  public getMatches(): RuleFailure[] {
    // Temporal workaround
    this.hook(null);
    return this.matches;
  }

  public getLimit() {
    return this.limit;
  }

  public getOptions(): any {
    return this.options;
  }

  public hasOption(option: string): boolean {
    if (this.options) {
      return this.options.indexOf(option) !== -1;
    } else {
      return false;
    }
  }

  public skip(node: ts.Node) {
    this.position += node.getFullWidth();
  }

  public createFailure(start: number, width: number, failure: string, fixes: Fix[] = []): RuleFailure {
    const from = (start > this.limit) ? this.limit : start;
    const to = ((start + width) > this.limit) ? this.limit : (start + width);
    return new RuleFailure(this.sourceFile, from, to, failure, this.ruleName, fixes);
  }

  public addFailure(match: RuleFailure) {
    if (!this.existsFailure(match) && !doesIntersect(match, this.disabledIntervals)) {
      if (this.hook) {
        return this.hook(match);
      } else {
        this.matches.push(match);
      }
    }
  }

  private existsFailure(match: RuleFailure) {
    return this.matches.some(m => m.equals(match));
  }
}
