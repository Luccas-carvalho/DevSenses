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

  // GH Desktop rules
  const canRename =
    repoActive &&
    (s.onNonDefaultBranch || !s.hasPublishedBranch) &&
    !s.branchIsUnborn &&
    !s.onDetachedHead
  const canDelete =
    repoActive && s.onNonDefaultBranch && !s.branchIsUnborn && !s.onDetachedHead
  const canUpdate =
    repoActive &&
    s.onBranch &&
    s.hasContributionTargetDefaultBranch &&
    !s.onContributionTargetDefaultBranch
  const canMerge = repoActive && s.onBranch && s.hasMultipleBranches
  const canRebase = repoActive && s.onBranch && s.hasMultipleBranches
  const canCompareToBranch = repoActive && !s.onDetachedHead && s.hasMultipleBranches
  const canCompareOnGitHub = repoActive && s.isHostedOnGitHub && s.hasPublishedBranch
  const canBranchOnGitHub = repoActive && s.isHostedOnGitHub && s.hasPublishedBranch
  const canViewOnGitHub = repoActive && s.isHostedOnGitHub
  const canCreatePR = repoActive && s.isHostedOnGitHub && !s.branchIsUnborn && !s.onDetachedHead
  const canPreviewPR = repoActive && s.isHostedOnGitHub && !s.branchIsUnborn && !s.onDetachedHead
  const canPush = repoActive && !s.branchIsUnborn && !s.onDetachedHead && !s.networkInProgress
  const canPull = repoActive && s.hasPublishedBranch && !s.networkInProgress
  const canFetch = repoActive && s.hasRemote && !s.networkInProgress
  const canCreateBranch = repoActive && !s.branchIsUnborn && !s.rebaseInProgress
  const canDiscard = repoActive && s.hasChangedFiles && !s.rebaseInProgress
  const canStash =
    repoActive && s.hasChangedFiles && s.onBranch && !s.rebaseInProgress && !s.hasConflicts

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
    label: 'Repository',
    submenu: [
      { label: 'Push', accelerator: 'CmdOrCtrl+P', enabled: canPush, click: menuAction('git-push') },
      { label: 'Pull', accelerator: 'CmdOrCtrl+Shift+P', enabled: canPull, click: menuAction('git-pull') },
      { label: 'Fetch', accelerator: 'CmdOrCtrl+Shift+T', enabled: canFetch, click: menuAction('git-fetch') },
      { type: 'separator' },
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
        label: 'Criar Issue',
        enabled: canViewOnGitHub,
        click: menuAction('create-issue')
      }
    ]
  }

  const branchMenu: MenuItemConstructorOptions = {
    label: 'Branch',
    submenu: [
      { label: 'Nova branch…', accelerator: 'CmdOrCtrl+Shift+N', enabled: canCreateBranch, click: menuAction('new-branch') },
      { label: 'Renomear…', accelerator: 'CmdOrCtrl+Shift+R', enabled: canRename, click: menuAction('rename-branch') },
      { label: 'Deletar…', accelerator: 'CmdOrCtrl+Shift+D', enabled: canDelete, click: menuAction('delete-branch') },
      { type: 'separator' },
      {
        label: 'Descartar todas mudanças…',
        accelerator: 'CmdOrCtrl+Shift+Backspace',
        enabled: canDiscard,
        click: menuAction('discard-all')
      },
      {
        label: 'Stash todas mudanças',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: canStash,
        click: menuAction('stash-all')
      },
      { type: 'separator' },
      {
        label: s.hasContributionTargetDefaultBranch && currentState.branchName
          ? `Atualizar do default`
          : 'Atualizar do default',
        accelerator: 'CmdOrCtrl+Shift+U',
        enabled: canUpdate,
        click: menuAction('update-from-default')
      },
      { label: 'Comparar com branch…', enabled: canCompareToBranch, click: menuAction('compare-to-branch') },
      { label: 'Mergear na atual…', accelerator: 'CmdOrCtrl+Shift+M', enabled: canMerge, click: menuAction('merge-into-current') },
      { label: 'Squash + Merge na atual…', accelerator: 'CmdOrCtrl+Shift+H', enabled: canMerge, click: menuAction('squash-into-current') },
      { label: 'Rebase na atual…', accelerator: 'CmdOrCtrl+Shift+E', enabled: canRebase, click: menuAction('rebase-current') },
      { type: 'separator' },
      { label: 'Comparar no GitHub', accelerator: 'CmdOrCtrl+Shift+C', enabled: canCompareOnGitHub, click: menuAction('compare-on-github') },
      { label: 'Ver branch no GitHub', accelerator: 'CmdOrCtrl+Alt+B', enabled: canBranchOnGitHub, click: menuAction('view-branch-on-github') },
      { label: 'Preview Pull Request', accelerator: 'CmdOrCtrl+Alt+P', enabled: canPreviewPR, click: menuAction('preview-pr') },
      { label: 'Criar Pull Request', accelerator: 'CmdOrCtrl+R', enabled: canCreatePR, click: menuAction('create-pr') }
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
    ? [appMenu, fileMenu, editMenu, viewMenu, repoMenu, branchMenu, helpMenu]
    : [fileMenu, editMenu, viewMenu, repoMenu, branchMenu, helpMenu]

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
