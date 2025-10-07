const vscode = require("vscode")
const JSZip = require("jszip")
const axios = require("axios")
const FormData = require("form-data")
const fs = require("fs")
const path = require("path")

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("interview.submitAssignment", () => {
      SubmissionPanel.createOrShow(context.extensionUri)
    })
  )
}

class SubmissionPanel {
  static currentPanel = undefined
  // Corrected: Defined static property using standard JavaScript syntax
  static viewType = "submission"

  static createOrShow(extensionUri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    if (SubmissionPanel.currentPanel) {
      SubmissionPanel.currentPanel._panel.reveal(column)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      SubmissionPanel.viewType,
      "Submit Your Work",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    )

    SubmissionPanel.currentPanel = new SubmissionPanel(panel, extensionUri)
  }

  _panel
  _extensionUri
  _disposables = []

  constructor(panel, extensionUri) {
    this._panel = panel
    this._extensionUri = extensionUri

    this._update()

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "submit":
            await this.handleSubmit(message.data)
            return
        }
      },
      null,
      this._disposables
    )
  }

  async handleSubmit(data) {
    const confirmation = await vscode.window.showInformationMessage(
      "Are you sure you want to submit? This will end the session.",
      { modal: true },
      "Yes, Submit"
    )

    if (confirmation !== "Yes, Submit") {
      return
    }

    vscode.window.showInformationMessage("Packaging your work...")

    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace is open.")
      return
    }

    try {
      const workspaceRoot = workspaceFolders[0].uri
      const zip = new JSZip()

      async function addFilesToZip(uri, zipFolder) {
        const entries = await vscode.workspace.fs.readDirectory(uri)
        for (const [name, type] of entries) {
          if (
            name.startsWith(".") ||
            name === "node_modules" ||
            name === "submissions"
          ) {
            continue
          }
          const entryUri = vscode.Uri.joinPath(uri, name)
          if (type === vscode.FileType.File) {
            const content = await vscode.workspace.fs.readFile(entryUri)
            zipFolder.file(name, content)
          } else if (type === vscode.FileType.Directory) {
            await addFilesToZip(entryUri, zipFolder.folder(name))
          }
        }
      }

      await addFilesToZip(workspaceRoot, zip)
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

      const sessionId = process.env.SESSION_ID
      if (!sessionId) {
        vscode.window.showErrorMessage("Error: SESSION_ID not found.")
        return
      }

      const submitUrl = `http://backend-service:3000/session/${sessionId}/submit`

      const form = new FormData()
      form.append("details", JSON.stringify(data))
      form.append("code", zipBuffer, { filename: "submission.zip" })

      await axios.post(submitUrl, form, { headers: form.getHeaders() })

      vscode.window.showInformationMessage(
        "Assignment submitted successfully! This session will now close."
      )
      this._panel.dispose()
    } catch (error) {
      console.error(
        "Submission failed:",
        error.response ? error.response.data : error.message
      )
      vscode.window.showErrorMessage(
        "Failed to submit assignment. Please contact your interviewer."
      )
    }
  }

  dispose() {
    SubmissionPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  _update() {
    const webview = this._panel.webview
    this._panel.title = "Submit Your Work"
    this._panel.webview.html = this._getHtmlForWebview(webview)
  }

  _getHtmlForWebview(webview) {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Submit Your Work</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; }
                .container { max-width: 600px; margin: 0 auto; }
                h1, h2 { color: #333; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input[type="text"], input[type="number"] {
                    width: calc(100% - 20px);
                    padding: 8px 10px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                }
                button {
                    background-color: #007ACC;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover { background-color: #005f9e; }
                .edu-group { border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Candidate Details</h1>
                <p>Please fill out your details before final submission.</p>

                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                
                <h2>Highest Education</h2>
                <div class="edu-group">
                    <div class="form-group">
                        <label for="he_course">Course / Degree</label>
                        <input type="text" id="he_course" name="he_course">
                    </div>
                    <div class="form-group">
                        <label for="he_college">College / University</label>
                        <input type="text" id="he_college" name="he_college">
                    </div>
                    <div class="form-group">
                        <label for="he_year">Year of Passing</label>
                        <input type="number" id="he_year" name="he_year">
                    </div>
                </div>

                <h2>Second Highest Education</h2>
                 <div class="edu-group">
                    <div class="form-group">
                        <label for="she_course">Course / Degree</label>
                        <input type="text" id="she_course" name="she_course">
                    </div>
                    <div class="form-group">
                        <label for="she_college">College / University</label>
                        <input type="text" id="she_college" name="she_college">
                    </div>
                    <div class="form-group">
                        <label for="she_year">Year of Passing</label>
                        <input type="number" id="she_year" name="she_year">
                    </div>
                </div>

                <br>
                <button id="submitBtn">Confirm and Submit</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('submitBtn').addEventListener('click', () => {
                    const data = {
                        firstName: document.getElementById('firstName').value,
                        lastName: document.getElementById('lastName').value,
                        highestEducation: {
                            course: document.getElementById('he_course').value,
                            college: document.getElementById('he_college').value,
                            year: document.getElementById('he_year').value
                        },
                        secondHighestEducation: {
                            course: document.getElementById('she_course').value,
                            college: document.getElementById('she_college').value,
                            year: document.getElementById('she_year').value
                        }
                    };
                    vscode.postMessage({ command: 'submit', data: data });
                });
            </script>
        </body>
        </html>`
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
