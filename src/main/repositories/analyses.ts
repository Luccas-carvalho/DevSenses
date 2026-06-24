import type Database from 'better-sqlite3'
import type { CodeReview } from '@shared/codeReview'

export interface AnalysisRecord {
  id: number
  projectPath: string
  projectName: string
  branch: string
  diffMode: string
  filesCount: number
  additions: number
  deletions: number
  diff: string
  analysis: string
  providerId: string
  seniority: string
  professorTurbo: boolean
  title: string | null
  createdAt: number
  review: CodeReview | null
}

export interface AnalysisListItem {
  id: number
  projectPath: string
  projectName: string
  branch: string
  diffMode: string
  filesCount: number
  additions: number
  deletions: number
  providerId: string
  title: string | null
  createdAt: number
}

export interface AnalysisInsert {
  projectPath: string
  projectName: string
  branch: string
  diffMode: string
  filesCount: number
  additions: number
  deletions: number
  diff: string
  analysis: string
  providerId: string
  seniority: string
  professorTurbo: boolean
  title?: string
}

export class AnalysesRepository {
  private insertStmt: Database.Statement
  private listProjectStmt: Database.Statement
  private listBranchStmt: Database.Statement
  private getStmt: Database.Statement
  private deleteStmt: Database.Statement
  private clearProjectStmt: Database.Statement
  private updateReviewStmt: Database.Statement

  constructor(db: Database.Database) {
    this.insertStmt = db.prepare(`
      INSERT INTO analyses (
        project_path, project_name, branch, diff_mode,
        files_count, additions, deletions,
        diff, analysis, provider_id, seniority, professor_turbo,
        title, created_at
      ) VALUES (
        @projectPath, @projectName, @branch, @diffMode,
        @filesCount, @additions, @deletions,
        @diff, @analysis, @providerId, @seniority, @professorTurbo,
        @title, @createdAt
      )
    `)
    this.listProjectStmt = db.prepare(`
      SELECT
        id, project_path AS projectPath, project_name AS projectName,
        branch, diff_mode AS diffMode,
        files_count AS filesCount, additions, deletions,
        provider_id AS providerId, title, created_at AS createdAt
      FROM analyses
      WHERE project_path = ?
      ORDER BY created_at DESC
      LIMIT 200
    `)
    this.listBranchStmt = db.prepare(`
      SELECT
        id, project_path AS projectPath, project_name AS projectName,
        branch, diff_mode AS diffMode,
        files_count AS filesCount, additions, deletions,
        provider_id AS providerId, title, created_at AS createdAt
      FROM analyses
      WHERE project_path = ? AND branch = ?
      ORDER BY created_at DESC
      LIMIT 200
    `)
    this.getStmt = db.prepare(`
      SELECT
        id, project_path AS projectPath, project_name AS projectName,
        branch, diff_mode AS diffMode,
        files_count AS filesCount, additions, deletions,
        diff, analysis, provider_id AS providerId, seniority,
        professor_turbo AS professorTurbo,
        title, created_at AS createdAt, review
      FROM analyses
      WHERE id = ?
    `)
    this.deleteStmt = db.prepare('DELETE FROM analyses WHERE id = ?')
    this.clearProjectStmt = db.prepare('DELETE FROM analyses WHERE project_path = ?')
    this.updateReviewStmt = db.prepare('UPDATE analyses SET review = ? WHERE id = ?')
  }

  insert(input: AnalysisInsert): number {
    const r = this.insertStmt.run({
      projectPath: input.projectPath,
      projectName: input.projectName,
      branch: input.branch,
      diffMode: input.diffMode,
      filesCount: input.filesCount,
      additions: input.additions,
      deletions: input.deletions,
      diff: input.diff,
      analysis: input.analysis,
      providerId: input.providerId,
      seniority: input.seniority,
      professorTurbo: input.professorTurbo ? 1 : 0,
      title: input.title ?? null,
      createdAt: Date.now()
    })
    return Number(r.lastInsertRowid)
  }

  list(projectPath: string, branch?: string): AnalysisListItem[] {
    return (
      branch ? this.listBranchStmt.all(projectPath, branch) : this.listProjectStmt.all(projectPath)
    ) as AnalysisListItem[]
  }

  get(id: number): AnalysisRecord | null {
    const row = this.getStmt.get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return {
      id: row.id as number,
      projectPath: row.projectPath as string,
      projectName: row.projectName as string,
      branch: row.branch as string,
      diffMode: row.diffMode as string,
      filesCount: row.filesCount as number,
      additions: row.additions as number,
      deletions: row.deletions as number,
      diff: row.diff as string,
      analysis: row.analysis as string,
      providerId: row.providerId as string,
      seniority: row.seniority as string,
      professorTurbo: Boolean(row.professorTurbo),
      title: (row.title as string | null) ?? null,
      createdAt: row.createdAt as number,
      review: parseReview(row.review)
    }
  }

  updateReview(id: number, review: CodeReview): void {
    this.updateReviewStmt.run(JSON.stringify(review), id)
  }

  delete(id: number): void {
    this.deleteStmt.run(id)
  }

  clearProject(projectPath: string): void {
    this.clearProjectStmt.run(projectPath)
  }
}

function parseReview(raw: unknown): CodeReview | null {
  if (typeof raw !== 'string' || !raw) return null
  try {
    return JSON.parse(raw) as CodeReview
  } catch {
    return null
  }
}
