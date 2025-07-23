// 📁 jgent/src/extension.js
const vscode = require("vscode");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

function activate(context) {
  console.log("💡 JGent 확장이 활성화되었습니다."); // 콘솔에 출력됨

  // 명령어 1: 코드 요청
  const runAgentCmd = vscode.commands.registerCommand("jgent.runAgent", async function () {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode.window.showWarningMessage("코드를 먼저 선택하세요.");
      return;
    }

    const config = vscode.workspace.getConfiguration("jgent");
    const userSelect = await vscode.window.showQuickPick(["auto", "chat"], {
      placeHolder: `작업 모드를 선택하세요 (기본값: ${config.get("defaultMode")})`
    });
    const mode = userSelect || config.get("defaultMode");

    const prompt = await vscode.window.showInputBox({ prompt: "요청할 작업을 입력하세요 (예: 리팩토링 해줘)" });
    if (!prompt) return;

    vscode.window.showInformationMessage("🚀 Agent 요청 중...");

    try {
      const res = await axios.post(config.get("agentApiUrl"), {
        prompt: prompt,
        code: selectedText,
        mode: mode,
        model: config.get("model")
      });

      const result = res.data.response || res.data.error;
      vscode.window.showInformationMessage("🧠 응답 완료. Webview에서 확인해주세요.");
      openWebview(result, context, editor, mode);

      if (mode === "auto") {
        const codeBlock = extractCodeFromMarkdown(result);
        if (codeBlock) {
          await applyCodeToFile(codeBlock, editor);
        } else {
          vscode.window.showWarningMessage("⚠️ 코드 블록이 발견되지 않았습니다.");
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage("❌ 오류 발생: " + error.message);
    }
  });

  // 명령어 2: 설정창
  const openSettingsCmd = vscode.commands.registerCommand("jgent.openSettings", () => {
    const config = vscode.workspace.getConfiguration("jgent");
    const panel = vscode.window.createWebviewPanel("jgentSettings", "JGent 설정", vscode.ViewColumn.One, {
      enableScripts: true
    });

    panel.webview.html = getSettingsWebviewHtml(config);

    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "saveSettings") {
          const { serverUrl, agentApiUrl, model, defaultMode } = message.data;
          await config.update("serverUrl", serverUrl, vscode.ConfigurationTarget.Global);
          await config.update("agentApiUrl", agentApiUrl, vscode.ConfigurationTarget.Global);
          await config.update("model", model, vscode.ConfigurationTarget.Global);
          await config.update("defaultMode", defaultMode, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage("⚙️ 설정이 저장되었습니다.");
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(runAgentCmd, openSettingsCmd);
}

function extractCodeFromMarkdown(text) {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

async function applyCodeToFile(code, editor) {
  await editor.edit((editBuilder) => {
    const selection = editor.selection;
    if (!selection.isEmpty) {
      editBuilder.replace(selection, code);
    } else {
      editBuilder.insert(selection.active, "\n" + code + "\n");
    }
  });
  vscode.window.showInformationMessage("✅ 코드가 자동 적용되었습니다.");
}

function openWebview(responseText, context, editor, mode) {
  const panel = vscode.window.createWebviewPanel("agentWebview", "Agent 응답", vscode.ViewColumn.Beside, {
    enableScripts: true,
    retainContextWhenHidden: true
  });

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.command === "sendPrompt") {
        const selectedText = vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor.selection) || "";
        const config = vscode.workspace.getConfiguration("jgent");

        const res = await axios.post(config.get("agentApiUrl"), {
          prompt: message.prompt,
          code: selectedText,
          mode: "chat",
          model: config.get("model")
        });

        const response = res.data.response || res.data.error;
        panel.webview.postMessage({ command: "displayResponse", text: response });
      } else if (message.command === "applyCode") {
        const codeBlock = extractCodeFromMarkdown(message.text);
        if (codeBlock) {
          await applyCodeToFile(codeBlock, vscode.window.activeTextEditor);
        }
      }
    },
    undefined,
    context.subscriptions
  );

  panel.webview.postMessage({ command: "displayResponse", text: responseText, mode });
}

function getWebviewContent() {
  return fs.readFileSync(path.join(__dirname, "webview", "chat.html"), "utf8");
}

function getSettingsWebviewHtml(config) {
  const htmlPath = path.join(__dirname, "settingsWebview.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const params = new URLSearchParams({
    serverUrl: config.get("serverUrl"),
    agentApiUrl: config.get("agentApiUrl"),
    model: config.get("model"),
    defaultMode: config.get("defaultMode")
  });
  return html.replace("<body>", `<body><script>location.search = "?${params.toString()}"</script>`);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
