const vscode = require('vscode');
const axios = require('axios');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('jgent.askAgent', async function () {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('편집기 창이 열려있지 않습니다.');
      return;
    }

    const selection = editor.document.getText(editor.selection);
    const prompt = selection || "선택된 코드가 없습니다.";

    try {
      const res = await axios.post("http://localhost:8000/agent", {
        prompt: prompt
      });

      vscode.window.showInformationMessage(res.data.response || '응답이 없습니다.');
    } catch (err) {
      vscode.window.showErrorMessage(`Agent 호출 오류: ${err.message}`);
    }
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
