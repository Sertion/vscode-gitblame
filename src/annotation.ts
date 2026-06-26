import { CancellationTokenSource, Disposable, window, workspace } from "vscode";
import type { Blamer } from "./blame.js";
import type { LineAttachedCommit } from "./git/LineAttachedCommit.js";
import { PropertyStore } from "./PropertyStore.js";

interface AnnotationState {
  enabled: boolean;
  editorId?: string;
}

export class AnnotationController {
  private readonly disposables: Disposable[] = [];
  // Render the annotation to the left of the code text but do not overlap or shift code.
  // Using a neutral margin prevents touching the code alignment while keeping the
  // annotation visually separated from the text. Placing annotations inside the
  // line-number gutter is not available in VS Code's API.
  // Decoration type is created per-refresh so we can apply a user-configurable offset.
  private decoration = window.createTextEditorDecorationType({ before: { margin: "0 12px 0 12px" }, rangeBehavior: 1 });
  private previousDecoration?: ReturnType<typeof window.createTextEditorDecorationType>;
  private state: AnnotationState = { enabled: false };
  private readonly debounceMs = 250;
  private timeout?: NodeJS.Timeout;
  private refreshToken?: CancellationTokenSource;

  private readonly blamer: Blamer;

  constructor(blamer: Blamer) {
    this.blamer = blamer;
    this.disposables.push(
      window.onDidChangeActiveTextEditor(() => this.debouncedRefresh()),
      workspace.onDidSaveTextDocument(() => this.debouncedRefresh()),
      workspace.onDidChangeTextDocument(() => this.debouncedRefresh()),
      workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("gitblame.annotationGutterOffset") || e.affectsConfiguration("gitblame.annotationShowAuthor") ) {
          void this.refresh();
        }
      }),
    );
    // Initialize global enabled state from configuration
    try {
      const enabled = Boolean(PropertyStore.get("annotationEnabled"));
      if (enabled) {
        // Global enabled means apply to any active editor the user opens.
        this.state = { enabled: true };
        void this.refresh();
      }
    } catch {
      // ignore
    }
  }

  private createDecoration(): ReturnType<typeof window.createTextEditorDecorationType> {
    const offset = Number(PropertyStore.get("annotationGutterOffset")) || -40;
    const margin = `0 12px 0 ${offset}px`;
    const background = String(PropertyStore.get("annotationBackground") ?? "#E6F7FF");
    return window.createTextEditorDecorationType({ before: { margin, backgroundColor: background }, rangeBehavior: 1 });
  }

  public dispose(): void {
    this.refreshToken?.cancel();
    try { this.decoration.dispose(); } catch {}
    try { this.previousDecoration?.dispose(); } catch {}
    for (const d of this.disposables) d.dispose();
  }

  public toggleForEditor(editor?: { document: { fileName: string } } | undefined): void {
    const active = window.activeTextEditor;
    if (!active || !active.document) return;

    if (this.state.enabled && this.state.editorId === active.document.fileName) {
      this.clearDecorations(active);
      this.state = { enabled: false };
      return;
    }

    // turn on for this editor only (single annotated editor at a time)
    this.clearAllEditors();
    this.state = { enabled: true, editorId: active.document.fileName };
    void this.refresh();
  }

  /** Toggle global annotation mode. When enabled, annotations are applied to every file the user opens. */
  public async toggleGlobal(): Promise<void> {
    const config = workspace.getConfiguration("gitblame");
    const current = Boolean(PropertyStore.get("annotationEnabled"));
    const next = !current;
    await config.update("annotationEnabled", next, true);
    if (next) {
      // enable global mode and apply decorations to all currently visible editors
      this.state = { enabled: true };
      // recreate decoration with current settings first
      try {
        this.previousDecoration = this.decoration;
        this.decoration = this.createDecoration();
        // clear any old decorations
        if (this.previousDecoration) {
          for (const ed of window.visibleTextEditors) {
            try { ed.setDecorations(this.previousDecoration, []); } catch {}
          }
        }
      } catch {
        // ignore
      }
      for (const ed of window.visibleTextEditors) {
        try {
          const blame = await this.blamer.getBlame(ed.document.fileName);
          if (!blame) continue;
          const opts = this.buildDecorationsForVisibleRanges(ed, blame);
          ed.setDecorations(this.decoration, opts);
        } catch {
          // ignore per-editor failures
        }
      }
    } else {
      // clear decorations from all editors (using current and previous decoration)
      for (const ed of window.visibleTextEditors) {
        try { ed.setDecorations(this.decoration, []); } catch {}
        if (this.previousDecoration) { try { ed.setDecorations(this.previousDecoration, []); } catch {} }
      }
      // dispose decoration instances
      try { this.decoration.dispose(); } catch {}
      try { this.previousDecoration?.dispose(); } catch {}
      this.previousDecoration = undefined;
      // cancel pending refreshes so they don't re-apply decorations
      this.refreshToken?.cancel();
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }
      this.state = { enabled: false };
      // recreate a neutral decoration so subsequent toggles still work
      this.decoration = window.createTextEditorDecorationType({ before: { margin: "0 12px 0 12px" }, rangeBehavior: 1 });
    }
  }

  private debouncedRefresh(): void {
    if (!this.state.enabled) return;
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => void this.refresh(), this.debounceMs);
  }

  private async refresh(): Promise<void> {
    const editor = window.activeTextEditor;
    if (!editor || !editor.document) return;
    // If global mode was disabled while a refresh was pending, skip applying decorations
    if (!this.state.enabled) return;
    // If a specific editorId is set, only apply to that file. If editorId is undefined,
    // treat as global mode and apply to whatever active editor the user opens.
    if (this.state.editorId && editor.document.fileName !== this.state.editorId) return;

    this.refreshToken?.cancel();
    this.refreshToken = new CancellationTokenSource();

    // Recreate decoration to apply the current gutter offset and background configuration.
    try {
      this.previousDecoration = this.decoration;
      this.decoration = this.createDecoration();
    } catch {
      // ignore
    }

    try {
      const blame = await this.blamer.getBlame(editor.document.fileName);
      if (!blame) return;

      const opts = this.buildDecorationsForVisibleRanges(editor, blame);
      editor.setDecorations(this.decoration, opts);
      // clear any previous decoration for this editor so background appears immediately
      if (this.previousDecoration) {
        try { editor.setDecorations(this.previousDecoration, []); } catch {}
      }
    } finally {
      // noop
    }
  }

  private buildDecorationsForVisibleRanges(editor: any, blame: Map<number, LineAttachedCommit | undefined>) {
    // Build decorations for the entire file (all lines) — annotation should be visible for every line.
    const totalLines = editor.document.lineCount;
    const options: any[] = new Array(totalLines);
    const showAuthor = PropertyStore.get("annotationShowAuthor");
    const showHash = PropertyStore.get("annotationShowHash");
    const showSummary = PropertyStore.get("annotationShowSummary");
    const relative = PropertyStore.get("annotationRelativeDate");
    const authorWidth = PropertyStore.get("annotationAuthorWidth");

    // Iterate all lines but pre-allocate to reduce reallocations.
    for (let line = 0; line < totalLines; line++) {
      const entry = blame.get(line + 1);
      const text = this.formatAnnotation(entry, { showAuthor, showHash, showSummary, relative, authorWidth });
      options[line] = { range: editor.document.lineAt(line).range, renderOptions: { before: { contentText: text } }, hoverMessage: this.buildHover(entry) };
    }

    return options;
  }

  private formatAnnotation(entry: LineAttachedCommit | undefined, opts: { showAuthor: boolean; showHash: boolean; showSummary: boolean; relative: boolean; authorWidth: number; }): string {
    // Show short info: [DD/MM/YY FirstName]
    if (!entry || !entry.commit) return "";
    const authorFull = entry.commit.author.name ?? "";
    let firstName = authorFull.split(" ")[0] ?? authorFull;
    // limit to initial 10 characters to keep annotations compact
    if (firstName.length > 10) {
      firstName = firstName.slice(0, 10);
    }
    const d = new Date(entry.commit.author.date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;
    // Build base annotation like: [DD/MM/YY FirstName]
    // Do NOT pad inside the brackets; padding is applied after the closing bracket to
    // ensure the total annotation column is a fixed width.
    const base = `[${dateStr} ${firstName}]`;
    // Ensure the annotation column occupies 22 characters total, then append a separator
    // ' |   ' (pipe + 3 spaces) before the code. We do NOT add spaces inside the brackets
    // after the name; padding is inserted after the closing bracket.
    const totalCol = Number(PropertyStore.get("annotationColumnWidth")) || 30;
    const padLength = Math.max(0, totalCol - base.length);
    // Use non-breaking spaces for padding so width is preserved visually
    const pad = '\u00A0'.repeat(padLength);
    // Append three non-breaking spaces after the padded annotation column to separate from code
    return `${base}${pad}${'\u00A0'.repeat(3)}`;
  }

  private buildHover(entry: LineAttachedCommit | undefined) {
    if (!entry) return undefined;
    const commit = entry.commit;
    const mail = (commit.author as any).mail ?? "";
    const dateStr = commit.author.date ? String(commit.author.date) : "";
    return `${commit.hash}\n${commit.author.name} <${mail}>\n${dateStr}\n\n${commit.summary ?? ""}`;
  }

  private clearDecorations(editor: any): void {
    editor.setDecorations(this.decoration, []);
  }

  private clearAllEditors(): void {
    for (const ed of window.visibleTextEditors) {
      try { ed.setDecorations(this.decoration, []); } catch {}
      if (this.previousDecoration) {
        try { ed.setDecorations(this.previousDecoration, []); } catch {}
      }
    }
  }
}





