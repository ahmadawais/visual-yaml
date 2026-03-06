import * as vscode from "vscode";
import { VisualYamlEditorProvider } from "./custom-editor-provider";
import { VisualYamlPanelProvider } from "./panel-provider";

export function activate(context: vscode.ExtensionContext) {
	const editorProvider = new VisualYamlEditorProvider(context);
	const panelProvider = new VisualYamlPanelProvider(context);

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			VisualYamlEditorProvider.viewType,
			editorProvider,
			{
				webviewOptions: { retainContextWhenHidden: true },
				supportsMultipleEditorsPerDocument: false,
			},
		),
	);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			VisualYamlPanelProvider.viewType,
			panelProvider,
			{ webviewOptions: { retainContextWhenHidden: true } },
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("visualYaml.openWithVisualYaml", () => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && activeEditor.document.languageId === "yaml") {
				vscode.commands.executeCommand(
					"vscode.openWith",
					activeEditor.document.uri,
					VisualYamlEditorProvider.viewType,
				);
			} else {
				vscode.window.showInformationMessage(
					"Open a YAML file first to use visual-yaml.",
				);
			}
		}),
	);
}

export function deactivate() {}
