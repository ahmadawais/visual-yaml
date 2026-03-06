import { parseYaml, resolveSchema } from "@visual-yaml/core";
import * as vscode from "vscode";
import {
	getWebviewHtml,
	type HostToWebviewMessage,
	type WebviewToHostMessage,
} from "./webview-utils";

export class VisualYamlPanelProvider implements vscode.WebviewViewProvider {
	static readonly viewType = "visualYaml.panel";

	private view?: vscode.WebviewView;
	private currentDocumentUri?: string;
	private ready = false;
	private suppressNextEdit = false;

	constructor(private readonly context: vscode.ExtensionContext) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, "dist"),
			],
		};

		webviewView.webview.html = getWebviewHtml(
			webviewView.webview,
			this.context.extensionUri,
		);

		webviewView.webview.onDidReceiveMessage(
			async (msg: WebviewToHostMessage) => {
				switch (msg.type) {
					case "ready": {
						this.ready = true;
						const modeMsg: HostToWebviewMessage = {
							type: "setMode",
							mode: "panel",
						};
						webviewView.webview.postMessage(modeMsg);
						this.syncWithActiveEditor();
						break;
					}
					case "edit": {
						await this.applyEditToDocument(msg.yaml);
						break;
					}
					case "requestSchema": {
						try {
							const parsed = parseYaml(msg.yaml);
							const schema = await resolveSchema(parsed, msg.filename);
							const result: HostToWebviewMessage = {
								type: "schemaResult",
								schema,
							};
							webviewView.webview.postMessage(result);
						} catch {
							const result: HostToWebviewMessage = {
								type: "schemaResult",
								schema: null,
							};
							webviewView.webview.postMessage(result);
						}
						break;
					}
				}
			},
		);

		const editorChangeSubscription = vscode.window.onDidChangeActiveTextEditor(
			() => {
				this.syncWithActiveEditor();
			},
		);

		const documentChangeSubscription = vscode.workspace.onDidChangeTextDocument(
			(e) => {
				if (
					this.currentDocumentUri &&
					e.document.uri.toString() === this.currentDocumentUri
				) {
					if (this.suppressNextEdit) {
						this.suppressNextEdit = false;
						return;
					}
					this.sendDocumentContent(e.document);
				}
			},
		);

		webviewView.onDidDispose(() => {
			editorChangeSubscription.dispose();
			documentChangeSubscription.dispose();
			this.view = undefined;
			this.ready = false;
		});
	}

	private syncWithActiveEditor() {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== "yaml") {
			this.currentDocumentUri = undefined;
			return;
		}
		this.currentDocumentUri = editor.document.uri.toString();
		this.sendDocumentContent(editor.document);
	}

	private sendDocumentContent(document: vscode.TextDocument) {
		if (!this.view || !this.ready) return;
		const filename = document.uri.path.split("/").pop() ?? "file.yaml";
		const msg: HostToWebviewMessage = {
			type: "setContent",
			yaml: document.getText(),
			filename,
		};
		this.view.webview.postMessage(msg);
	}

	private async applyEditToDocument(yaml: string) {
		if (!this.currentDocumentUri) return;
		const uri = vscode.Uri.parse(this.currentDocumentUri);
		const document = vscode.workspace.textDocuments.find(
			(d) => d.uri.toString() === uri.toString(),
		);
		if (!document) return;

		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			yaml,
		);
		this.suppressNextEdit = true;
		await vscode.workspace.applyEdit(edit);
	}
}
