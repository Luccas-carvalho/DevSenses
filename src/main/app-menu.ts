import { app, Menu, BrowserWindow, dialog, shell, ipcMain } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import type { IpcContract } from '@shared/ipc-contract'

export interface MenuState {
  hasProject: boolean
  branchName: string | null
  onBranch: boolean
  onDetachedHead: boolean
  branchIsUnborn: boolean
  onNonDefaultBranch: boolean
  hasPublishedBranch: boolean
  hasRemote: boolean
  isHostedOnGitHub: boolean
  hasChangedFiles: boolean
  hasStaged: boolean
  hasMultipleBranches: boolean
  hasConflicts: boolean
  rebaseInProgress: boolean
  isMerging: boolean
  networkInProgress: boolean
  branchHasStash: boolean
  hasContributionTargetDefaultBranch: boolean
  onContributionTargetDefaultBranch: boolean
  isAhead: boolean
  isBehind: boolean
}

const DEFAULT_STATE: MenuState = {
  hasProject: false,
  branchName: null,
  onBranch: false,
  onDetachedHead: false,
  branchIsUnborn: false,
  onNonDefaultBranch: false,
  hasPublishedBranch: false,
  hasRemote: false,
  isHostedOnGitHub: false,
  hasChangedFiles: false,
  hasStaged: false,
  hasMultipleBranches: false,
  hasConflicts: false,
  rebaseInProgress: false,
  isMerging: false,
  networkInProgress: false,
  branchHasStash: false,
  hasContributionTargetDefaultBranch: false,
  onContributionTargetDefaultBranch: false,
  isAhead: false,
  isBehind: false
}

let currentState: MenuState = { ...DEFAULT_STATE }

function send(channel: string, payload?: unknown): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  win?.webContents.send(channel, payload)
}

function menuAction(action: string): () => void {
  return () => send('menu:action', { action })
}

function buildMenu(s: MenuState): Menu {
  const isMac = process.platform === 'darwin'
  const repoActive = s.hasProject

  // Read-only mode — só leitura externa
  const canBranchOnGitHub = repoActive && s.isHostedOnGitHub && s.hasPublishedBranch
  const canViewOnGitHub = repoActive && s.isHostedOnGitHub

  const appMenu: MenuItemConstructorOptions = {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { label: 'Configurações…', accelerator: 'CmdOrCtrl+,', click: menuAction('open-settings') },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }

  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      { label: 'Novo repositório…', accelerator: 'CmdOrCtrl+N', click: menuAction('new-repo') },
      {
        label: 'Adicionar repositório local…',
        accelerator: 'CmdOrCtrl+O',
        click: menuAction('open-local')
      },
      {
        label: 'Clonar repositório…',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: menuAction('clone-repo')
      },
      { type: 'separator' },
      {
        label: 'Voltar pro Home',
        accelerator: 'CmdOrCtrl+H',
        enabled: repoActive,
        click: menuAction('go-home')
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  }

  const editMenu: MenuItemConstructorOptions = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      { type: 'separator' },
      {
        label: 'Buscar no diff',
        accelerator: 'CmdOrCtrl+F',
        enabled: repoActive,
        click: menuAction('find-in-diff')
      }
    ]
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      { label: 'Mostrar Changes', accelerator: 'CmdOrCtrl+1', enabled: repoActive, click: menuAction('show-changes') },
      { label: 'Mostrar History', accelerator: 'CmdOrCtrl+2', enabled: repoActive, click: menuAction('show-history') },
      { type: 'separator' },
      { label: 'Switcher de repositório', accelerator: 'CmdOrCtrl+T', click: menuAction('open-repo-switcher') },
      { label: 'Switcher de branch', accelerator: 'CmdOrCtrl+B', enabled: repoActive, click: menuAction('open-branch-switcher') },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }

  const repoMenu: MenuItemConstructorOptions = {
    label: 'Repositório',
    submenu: [
      {
        label: 'Abrir no editor',
        accelerator: 'CmdOrCtrl+Shift+A',
        enabled: repoActive,
        click: menuAction('open-in-editor')
      },
      {
        label: 'Abrir no terminal',
        accelerator: 'CmdOrCtrl+`',
        enabled: repoActive,
        click: menuAction('open-in-terminal')
      },
      {
        label: 'Mostrar no Finder',
        accelerator: 'CmdOrCtrl+Shift+F',
        enabled: repoActive,
        click: menuAction('open-in-finder')
      },
      { type: 'separator' },
      {
        label: 'Ver no GitHub',
        accelerator: 'CmdOrCtrl+Shift+G',
        enabled: canViewOnGitHub,
        click: menuAction('view-on-github')
      },
      {
        label: 'Ver branch no GitHub',
        accelerator: 'CmdOrCtrl+Alt+B',
        enabled: canBranchOnGitHub,
        click: menuAction('view-branch-on-github')
      }
    ]
  }

  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
    submenu: [
      {
        label: 'Sobre DevSenses',
        click: () => {
          dialog.showMessageBox({
            type: 'info',
            title: 'DevSenses',
            message: 'DevSenses',
            detail: 'AI-powered git diff reviewer + GitHub Desktop replacement.'
          })
        }
      },
      {
        label: 'Reportar bug',
        click: () => shell.openExternal('https://github.com/devsenses/desktop/issues/new')
      }
    ]
  }

  const template: MenuItemConstructorOptions[] = isMac
    ? [appMenu, fileMenu, editMenu, viewMenu, repoMenu, helpMenu]
    : [fileMenu, editMenu, viewMenu, repoMenu, helpMenu]

  return Menu.buildFromTemplate(template)
}

function applyMenu(): void {
  Menu.setApplicationMenu(buildMenu(currentState))
}

export function installAppMenu(): void {
  applyMenu()
  ipcMain.handle('menu:setState', (_, payload: IpcContract['menu:setState']['request']) => {
    currentState = { ...payload }
    applyMenu()
  })
}
