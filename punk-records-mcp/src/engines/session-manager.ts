import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { PATHS, DATA_ROOT } from "../config.js";
import { ensureDir } from "../utils/files.js";
import { readMarkdownFileIfExists } from "../utils/markdown.js";
import { indexFile } from "../search/indexer.js";

// --- Types ---

interface ProjectState {
  project: string;
  displayName: string;
  created: string;
  phase:
    | "planning"
    | "setup"
    | "implementation"
    | "testing"
    | "maintenance"
    | "paused"
    | "completed";
  health: "green" | "yellow" | "red";
  totalSessions: number;
  lastSession: {
    id: string;
    date: string;
    summary: string;
    durationMinutes: number;
  } | null;
  currentFocus: string;
  activeTask: string | null;
  pendingWork: string[];
  blockers: Blocker[];
  openQuestions: string[];
  recentDecisions: RecentDecision[];
  recentProblems: RecentProblem[];
  recentLessons: string[];
  techStack: Record<string, string>;
  keyFiles: string[];
  workPatterns: {
    avgSessionLength: number;
    commonBlockers: string[];
  };
}

interface Blocker {
  id: string;
  description: string;
  since: string;
  severity: "blocking" | "slowing" | "annoying";
}

interface RecentDecision {
  date: string;
  what: string;
  why: string;
  confidence: "high" | "medium" | "low" | "revisit";
}

interface RecentProblem {
  description: string;
  status: "open" | "resolved" | "parked";
  opened: string;
  resolved?: string;
  resolution?: string;
}

type EventType =
  | "session_start"
  | "session_end"
  | "decision"
  | "decision_reversed"
  | "problem_identified"
  | "problem_resolved"
  | "problem_parked"
  | "question_raised"
  | "question_answered"
  | "blocker_hit"
  | "blocker_cleared"
  | "task_started"
  | "task_completed"
  | "task_abandoned"
  | "lesson_learned"
  | "pattern_applied"
  | "pattern_failed"
  | "context_shift"
  | "frustration_detected"
  | "breakthrough"
  | "file_created"
  | "file_major_change"
  | "architecture_change";

interface TimelineEvent {
  id: string;
  ts: string;
  sessionId: string;
  event: EventType;
  data: Record<string, unknown>;
  confidence: number;
}

interface ActiveSession {
  id: string;
  project: string;
  started: string;
  initialGoal: string;
  events: TimelineEvent[];
}

interface SessionRecord {
  id: string;
  project: string;
  started: string;
  ended: string;
  durationMinutes: number;
  initialGoal: string;
  actualOutcome: string;
  goalAchieved: "fully" | "partially" | "pivoted" | "blocked";
  events: TimelineEvent[];
  decisions: RecentDecision[];
  problems: RecentProblem[];
  lessons: string[];
  pendingForNext: string[];
}

// --- Helpers ---

/** Safely extract a string from an unknown event data field */
function str(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return JSON.stringify(value);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function projectDir(project: string): string {
  return path.join(PATHS.projects, project);
}

function statePath(project: string): string {
  return path.join(projectDir(project), "state.json");
}

function timelinePath(project: string): string {
  return path.join(projectDir(project), "timeline.jsonl");
}

function sessionsDir(project: string): string {
  return path.join(projectDir(project), "sessions");
}

function extractedDir(project: string): string {
  return path.join(projectDir(project), "extracted");
}

// --- SessionManager ---

class SessionManager {
  private activeSession: ActiveSession | null = null;
  private activeSessionFile = path.join(DATA_ROOT, ".active-session.json");

  constructor() {
    // Restore active session on startup
    this.restoreActiveSession();
  }

  /**
   * Restore active session from disk if it exists and is recent (< 24h old)
   */
  private restoreActiveSession(): void {
    try {
      if (fs.existsSync(this.activeSessionFile)) {
        const data = fs.readFileSync(this.activeSessionFile, "utf-8");
        const session = JSON.parse(data) as ActiveSession;

        // Only restore if session is less than 24 hours old
        const sessionAge = Date.now() - new Date(session.started).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (sessionAge < twentyFourHours) {
          this.activeSession = session;
          console.error(`[session-manager] Restored active session: ${session.project} (${session.id})`);
        } else {
          // Session too old, delete it
          fs.unlinkSync(this.activeSessionFile);
        }
      }
    } catch (err) {
      console.error("[session-manager] Failed to restore active session:", err);
    }
  }

  /**
   * Save active session to disk
   */
  private saveActiveSession(): void {
    try {
      if (this.activeSession) {
        fs.writeFileSync(
          this.activeSessionFile,
          JSON.stringify(this.activeSession, null, 2),
          "utf-8"
        );
      } else {
        // No active session, remove the file
        if (fs.existsSync(this.activeSessionFile)) {
          fs.unlinkSync(this.activeSessionFile);
        }
      }
    } catch (err) {
      console.error("[session-manager] Failed to save active session:", err);
    }
  }

  /**
   * Start a work session on a project. Returns full context for Claude.
   */
  async beginSession(project: string, goal?: string): Promise<string> {
    const state = await this.loadOrCreateState(project);

    this.activeSession = {
      id: generateId("ses"),
      project,
      started: new Date().toISOString(),
      initialGoal: goal ?? "Continuing work",
      events: [],
    };

    // Record session start event
    await this.recordEvent("session_start", {
      goal: this.activeSession.initialGoal,
      continuingFrom: state.lastSession?.id ?? null,
    });

    // Save session to disk
    this.saveActiveSession();

    // Load core knowledge — the brain
    const coreContext = await this.loadCoreKnowledge();

    return coreContext + this.formatSessionContext(state);
  }

  /**
   * Record a significant event during the active session.
   * If no session is active, auto-begins one for the given project.
   */
  async recordEvent(
    eventType: EventType,
    data: Record<string, unknown>,
    confidence: number = 0.9,
    project?: string,
  ): Promise<TimelineEvent> {
    if (this.activeSession === null) {
      if (project !== undefined) {
        await this.beginSession(project);
      } else {
        throw new Error(
          "No active session. Call beginSession first or pass a project.",
        );
      }
    }

    // Safe to assert: either activeSession was already set, or beginSession above set it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const session = this.activeSession!;

    const event: TimelineEvent = {
      id: generateId("evt"),
      ts: new Date().toISOString(),
      sessionId: session.id,
      event: eventType,
      data,
      confidence,
    };

    session.events.push(event);

    // Append to timeline immediately (crash safety)
    await this.appendToTimeline(session.project, event);

    // Save session to disk (persist across restarts)
    this.saveActiveSession();

    return event;
  }

  /**
   * End the current session. Extracts insights, saves record, updates state.
   * Returns gracefully if no session is active.
   */
  async endSession(summary?: string, pendingWork?: string[]): Promise<string> {
    if (this.activeSession === null) {
      return "No active session to end. Events recorded during this conversation were already persisted individually.";
    }

    // Record session end
    await this.recordEvent("session_end", {
      summary: summary ?? "Session ended",
      pendingWork: pendingWork ?? [],
    });

    // Extract insights
    const extraction = this.extractInsights(this.activeSession);

    // Build session record
    const ended = new Date().toISOString();
    const durationMs =
      new Date(ended).getTime() -
      new Date(this.activeSession.started).getTime();
    const record: SessionRecord = {
      id: this.activeSession.id,
      project: this.activeSession.project,
      started: this.activeSession.started,
      ended,
      durationMinutes: Math.round(durationMs / 60000),
      initialGoal: this.activeSession.initialGoal,
      actualOutcome: summary ?? extraction.outcome,
      goalAchieved: extraction.goalAchieved,
      events: this.activeSession.events,
      decisions: extraction.decisions,
      problems: extraction.problems,
      lessons: extraction.lessons,
      pendingForNext: pendingWork ?? extraction.pendingWork,
    };

    // Save session record
    await this.saveSessionRecord(record);

    // Update project state
    await this.updateProjectState(record, extraction);

    // Update extracted docs
    await this.updateExtractedDocs(this.activeSession.project);

    // Format summary
    const output = this.formatSessionSummary(record);
    this.activeSession = null;

    // Clear persisted session file
    this.saveActiveSession();

    return output;
  }

  /**
   * Get project memory without starting a formal session.
   */
  async recallProject(
    project: string,
    depth: "quick" | "full" | "deep" = "full",
  ): Promise<string> {
    const state = await this.loadOrCreateState(project);

    if (depth === "quick") {
      return this.formatQuickRecall(state);
    }

    let output = this.formatSessionContext(state);

    if (depth === "deep") {
      // Include full timeline
      const timeline = await this.loadTimeline(project);
      if (timeline.length > 0) {
        output += "\n\n### Full Timeline (last 50 events)\n";
        for (const event of timeline.slice(-50)) {
          output += `- [${event.ts}] **${event.event}**: ${JSON.stringify(event.data)}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Analyze how a project has evolved over time.
   */
  async analyzeEvolution(
    project: string,
    timeframe: "week" | "month" | "all" = "month",
  ): Promise<string> {
    const sessions = await this.loadAllSessions(project);

    const cutoff = new Date();
    if (timeframe === "week") {
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (timeframe === "month") {
      cutoff.setDate(cutoff.getDate() - 30);
    } else {
      cutoff.setFullYear(2000);
    }

    const filtered = sessions.filter((s) => new Date(s.started) >= cutoff);

    if (filtered.length === 0) {
      return `## Project Evolution: ${project}\nNo sessions found in the ${timeframe} timeframe.`;
    }

    let output = `## Project Evolution: ${project}\n`;
    output += `**Timeframe:** ${timeframe} | **Sessions:** ${filtered.length}\n\n`;

    // Decision trajectory
    const allDecisions = filtered.flatMap((s) => s.decisions);
    if (allDecisions.length > 0) {
      output += "### Decisions\n";
      for (const d of allDecisions) {
        output += `- [${d.date}] ${d.what} — ${d.why} (${d.confidence})\n`;
      }
      output += "\n";
    }

    // Recurring problems
    const allProblems = filtered.flatMap((s) => s.problems);
    const problemCounts = new Map<string, number>();
    for (const p of allProblems) {
      const key = p.description.toLowerCase().slice(0, 50);
      problemCounts.set(key, (problemCounts.get(key) ?? 0) + 1);
    }
    const recurring = [...problemCounts.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    if (recurring.length > 0) {
      output += "### Recurring Problems\n";
      for (const [problem, count] of recurring) {
        output += `- (${count}x) ${problem}\n`;
      }
      output += "\n";
    }

    // Lessons learned
    const allLessons = filtered.flatMap((s) => s.lessons);
    if (allLessons.length > 0) {
      output += "### Lessons Learned\n";
      for (const l of allLessons) {
        output += `- ${l}\n`;
      }
      output += "\n";
    }

    // Session productivity
    const avgDuration =
      filtered.reduce((sum, s) => sum + s.durationMinutes, 0) / filtered.length;
    const achievements = filtered.filter(
      (s) => s.goalAchieved === "fully" || s.goalAchieved === "partially",
    ).length;
    output += `### Productivity\n`;
    output += `- Average session: ${Math.round(avgDuration)} minutes\n`;
    output += `- Goal achievement rate: ${Math.round((achievements / filtered.length) * 100)}%\n`;

    return output;
  }

  /** Check if there's an active session */
  hasActiveSession(): boolean {
    return this.activeSession !== null;
  }

  /** Get current session project (for query log hooks) */
  getActiveProject(): string | null {
    return this.activeSession?.project ?? null;
  }

  // --- Private helpers ---

  private async loadCoreKnowledge(): Promise<string> {
    const corePath = PATHS.core;
    const essentials = ["identity.md", "philosophy.md", "anti-patterns.md"];
    const sections: string[] = [];

    for (const file of essentials) {
      const doc = await readMarkdownFileIfExists(path.join(corePath, file));
      if (doc !== null && doc.content.trim().length > 0) {
        sections.push(`### ${doc.title}\n${doc.content.trim()}`);
      }
    }

    // Current focus
    const focus = await readMarkdownFileIfExists(
      path.join(PATHS.active, "current-focus.md"),
    );
    if (focus !== null && focus.content.trim().length > 0) {
      sections.push(`### Current Focus\n${focus.content.trim()}`);
    }

    if (sections.length === 0) return "";

    return `## Core Knowledge\n\n${sections.join("\n\n")}\n\n---\n\n`;
  }

  private async loadOrCreateState(project: string): Promise<ProjectState> {
    const sp = statePath(project);
    try {
      const raw = await fsp.readFile(sp, "utf-8");
      return JSON.parse(raw) as ProjectState;
    } catch {
      // Create default state
      const state: ProjectState = {
        project,
        displayName: project,
        created: new Date().toISOString(),
        phase: "planning",
        health: "green",
        totalSessions: 0,
        lastSession: null,
        currentFocus: "",
        activeTask: null,
        pendingWork: [],
        blockers: [],
        openQuestions: [],
        recentDecisions: [],
        recentProblems: [],
        recentLessons: [],
        techStack: {},
        keyFiles: [],
        workPatterns: {
          avgSessionLength: 0,
          commonBlockers: [],
        },
      };
      await ensureDir(projectDir(project));
      await fsp.writeFile(sp, JSON.stringify(state, null, 2), "utf-8");
      return state;
    }
  }

  private async appendToTimeline(
    project: string,
    event: TimelineEvent,
  ): Promise<void> {
    await ensureDir(projectDir(project));
    await fsp.appendFile(
      timelinePath(project),
      JSON.stringify(event) + "\n",
      "utf-8",
    );
  }

  private async loadTimeline(project: string): Promise<TimelineEvent[]> {
    try {
      const raw = await fsp.readFile(timelinePath(project), "utf-8");
      return raw
        .split("\n")
        .filter((l) => l.trim() !== "")
        .map((l) => JSON.parse(l) as TimelineEvent);
    } catch {
      return [];
    }
  }

  private async saveSessionRecord(record: SessionRecord): Promise<void> {
    const dir = sessionsDir(record.project);
    await ensureDir(dir);
    const date = record.started.slice(0, 10);
    // Find next session number for this date
    let n = 1;
    while (
      fs.existsSync(
        path.join(dir, `${date}-${String(n).padStart(3, "0")}.json`),
      )
    ) {
      n++;
    }
    const filename = `${date}-${String(n).padStart(3, "0")}.json`;
    await fsp.writeFile(
      path.join(dir, filename),
      JSON.stringify(record, null, 2),
      "utf-8",
    );
  }

  private async loadAllSessions(project: string): Promise<SessionRecord[]> {
    const dir = sessionsDir(project);
    try {
      const files = await fsp.readdir(dir);
      const sessions: SessionRecord[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const raw = await fsp.readFile(path.join(dir, file), "utf-8");
        sessions.push(JSON.parse(raw) as SessionRecord);
      }
      sessions.sort(
        (a, b) => new Date(a.started).getTime() - new Date(b.started).getTime(),
      );
      return sessions;
    } catch {
      return [];
    }
  }

  private async updateProjectState(
    record: SessionRecord,
    extraction: SessionExtraction,
  ): Promise<void> {
    const state = await this.loadOrCreateState(record.project);

    state.totalSessions++;
    state.lastSession = {
      id: record.id,
      date: record.started.slice(0, 10),
      summary: record.actualOutcome,
      durationMinutes: record.durationMinutes,
    };
    state.pendingWork = record.pendingForNext;

    // Merge recent decisions (keep last 10)
    state.recentDecisions = [
      ...extraction.decisions,
      ...state.recentDecisions,
    ].slice(0, 10);

    // Merge recent problems
    for (const p of extraction.problems) {
      const existing = state.recentProblems.find(
        (rp) => rp.description === p.description,
      );
      if (existing !== undefined) {
        existing.status = p.status;
        if (p.resolution !== undefined) existing.resolution = p.resolution;
        if (p.resolved !== undefined) existing.resolved = p.resolved;
      } else {
        state.recentProblems.push(p);
      }
    }
    // Keep only last 20 problems
    state.recentProblems = state.recentProblems.slice(0, 20);

    // Merge lessons (keep last 15)
    state.recentLessons = [...extraction.lessons, ...state.recentLessons].slice(
      0,
      15,
    );

    // Update blockers from events
    for (const event of record.events) {
      if (event.event === "blocker_hit") {
        const desc = str(event.data.description, "Unknown blocker");
        if (!state.blockers.some((b) => b.description === desc)) {
          const severity =
            typeof event.data.severity === "string"
              ? (event.data.severity as Blocker["severity"])
              : "slowing";
          state.blockers.push({
            id: generateId("blk"),
            description: desc,
            since: event.ts,
            severity,
          });
        }
      }
      if (event.event === "blocker_cleared") {
        const desc = str(event.data.description);
        state.blockers = state.blockers.filter((b) => b.description !== desc);
      }
    }

    // Update health based on blockers
    if (state.blockers.some((b) => b.severity === "blocking")) {
      state.health = "red";
    } else if (state.blockers.length > 0) {
      state.health = "yellow";
    } else {
      state.health = "green";
    }

    // Update work patterns
    const avgLen = state.workPatterns.avgSessionLength;
    state.workPatterns.avgSessionLength =
      avgLen === 0
        ? record.durationMinutes
        : Math.round((avgLen + record.durationMinutes) / 2);

    await fsp.writeFile(
      statePath(record.project),
      JSON.stringify(state, null, 2),
      "utf-8",
    );
  }

  private async updateExtractedDocs(project: string): Promise<void> {
    const dir = projectDir(project);
    await ensureDir(dir);

    const sessions = await this.loadAllSessions(project);
    const timeline = await this.loadTimeline(project);

    // decisions.md — Rich format with why, alternatives, context
    const decisionEvents = timeline.filter((e) => e.event === "decision");
    if (decisionEvents.length > 0) {
      let md = `---
title: "${project} Decisions"
domain: "memory"
tags: ["${project}", "decisions"]
auto_generated: true
updated: "${new Date().toISOString().slice(0, 10)}"
---

# ${project} — Decisions

*Auto-maintained from session timeline. Each decision captures what was chosen and why.*

---

`;
      for (const e of decisionEvents) {
        const date = e.ts.slice(0, 10);
        const what = str(e.data.description) || str(e.data.what);
        const why = str(e.data.why) || str(e.data.reasoning);
        const alternatives = str(e.data.alternatives) || str(e.data.alternatives_rejected);

        md += `### ${date} — ${what}\n\n`;
        md += `**Why:** ${why}\n\n`;
        if (alternatives) {
          md += `**Alternatives considered:** ${alternatives}\n\n`;
        }
        md += `---\n\n`;
      }
      const decisionsPath = path.join(dir, "decisions.md");
      await fsp.writeFile(decisionsPath, md, "utf-8");
      // Auto-index the generated file
      await indexFile(decisionsPath).catch((err) =>
        console.error("[session-manager] Failed to index decisions.md:", err),
      );
    }

    // lessons.md — Rich format with context, what was learned
    const lessonEvents = timeline.filter((e) => e.event === "lesson_learned");
    if (lessonEvents.length > 0) {
      let md = `---
title: "${project} Lessons"
domain: "memory"
tags: ["${project}", "lessons"]
auto_generated: true
updated: "${new Date().toISOString().slice(0, 10)}"
---

# ${project} — Lessons Learned

*Auto-maintained from session timeline. Non-obvious discoveries and mistakes that taught something.*

---

`;
      for (const e of lessonEvents) {
        const date = e.ts.slice(0, 10);
        const lesson = str(e.data.description) || str(e.data.lesson);
        const context = str(e.data.context);
        const whatWorks = str(e.data.what_works);
        const gap = str(e.data.gap) || str(e.data.critical_gaps);

        md += `### ${date} — ${lesson}\n\n`;
        if (context) {
          md += `**Context:** ${context}\n\n`;
        }
        if (whatWorks) {
          md += `**What works:** ${whatWorks}\n\n`;
        }
        if (gap) {
          md += `**Gap:** ${gap}\n\n`;
        }
        md += `---\n\n`;
      }
      const lessonsPath = path.join(dir, "lessons.md");
      await fsp.writeFile(lessonsPath, md, "utf-8");
      // Auto-index the generated file
      await indexFile(lessonsPath).catch((err) =>
        console.error("[session-manager] Failed to index lessons.md:", err),
      );
    }

    // problems.md
    const allProblems = sessions.flatMap((s) => s.problems);
    if (allProblems.length > 0) {
      const open = allProblems.filter((p) => p.status === "open");
      const resolved = allProblems.filter((p) => p.status === "resolved");
      let md = `---
title: "${project} Problems"
domain: "memory"
tags: ["${project}", "problems"]
auto_generated: true
updated: "${new Date().toISOString().slice(0, 10)}"
---

# ${project} — Problems

*Auto-maintained from session timeline.*

---

`;
      if (open.length > 0) {
        md += "## Open\n\n";
        for (const p of open) {
          md += `- **${p.description}** (since ${p.opened})\n`;
        }
        md += "\n";
      }
      if (resolved.length > 0) {
        md += "## Resolved\n\n";
        for (const p of resolved) {
          md += `- ~~${p.description}~~ → ${p.resolution ?? "resolved"} *(${p.resolved ?? ""})*\n`;
        }
      }
      const problemsPath = path.join(dir, "problems.md");
      await fsp.writeFile(problemsPath, md, "utf-8");
      // Auto-index the generated file
      await indexFile(problemsPath).catch((err) =>
        console.error("[session-manager] Failed to index problems.md:", err),
      );
    }
  }

  private extractInsights(session: ActiveSession): SessionExtraction {
    const events = session.events;

    const decisions: RecentDecision[] = events
      .filter((e) => e.event === "decision")
      .map((e) => {
        const conf =
          typeof e.data.confidence === "string"
            ? (e.data.confidence as RecentDecision["confidence"])
            : "medium";
        return {
          date: e.ts.slice(0, 10),
          what: str(e.data.description) || str(e.data.what),
          why: str(e.data.why) || str(e.data.reason),
          confidence: conf,
        };
      });

    const problems: RecentProblem[] = [];
    for (const e of events) {
      if (e.event === "problem_identified") {
        problems.push({
          description: str(e.data.description),
          status: "open",
          opened: e.ts.slice(0, 10),
        });
      }
      if (e.event === "problem_resolved") {
        const desc = str(e.data.description);
        const existing = problems.find((p) => p.description === desc);
        if (existing !== undefined) {
          existing.status = "resolved";
          existing.resolved = e.ts.slice(0, 10);
          existing.resolution = str(e.data.resolution);
        } else {
          problems.push({
            description: desc,
            status: "resolved",
            opened: e.ts.slice(0, 10),
            resolved: e.ts.slice(0, 10),
            resolution: str(e.data.resolution),
          });
        }
      }
    }

    const lessons = events
      .filter((e) => e.event === "lesson_learned")
      .map((e) => str(e.data.description) || str(e.data.lesson));

    // Determine outcome
    const endEvent = events.find((e) => e.event === "session_end");
    const outcome =
      endEvent !== undefined
        ? str(endEvent.data.summary, "Session completed")
        : "Session completed";

    // Determine goal achievement
    const completedTasks = events.filter(
      (e) => e.event === "task_completed",
    ).length;
    const blockers = events.filter((e) => e.event === "blocker_hit").length;
    let goalAchieved: SessionRecord["goalAchieved"] = "partially";
    if (blockers > 0 && completedTasks === 0) goalAchieved = "blocked";
    else if (completedTasks > 0 && blockers === 0) goalAchieved = "fully";

    const pendingWork =
      endEvent !== undefined && Array.isArray(endEvent.data.pendingWork)
        ? (endEvent.data.pendingWork as string[])
        : [];

    return {
      outcome,
      goalAchieved,
      decisions,
      problems,
      lessons,
      pendingWork,
    };
  }

  private formatSessionContext(state: ProjectState): string {
    let output = `## Project: ${state.displayName}\n`;
    output += `**Phase:** ${state.phase} | **Health:** ${state.health} | **Sessions:** ${state.totalSessions}\n\n`;

    if (state.lastSession !== null) {
      output += `### Last Session (${state.lastSession.date})\n`;
      output += `${state.lastSession.summary}\n\n`;
      if (state.pendingWork.length > 0) {
        output += "**Pending from last session:**\n";
        for (const item of state.pendingWork) {
          output += `- [ ] ${item}\n`;
        }
        output += "\n";
      }
    }

    if (state.blockers.length > 0) {
      output += "### Blockers\n";
      for (const b of state.blockers) {
        output += `- [${b.severity.toUpperCase()}] ${b.description} (since ${b.since})\n`;
      }
      output += "\n";
    } else {
      output += "### Blockers: None\n\n";
    }

    if (state.openQuestions.length > 0) {
      output += "### Open Questions\n";
      for (const q of state.openQuestions) {
        output += `- ${q}\n`;
      }
      output += "\n";
    }

    if (state.recentDecisions.length > 0) {
      output += "### Recent Decisions\n";
      output +=
        "| Date | Decision | Why | Confidence |\n|------|----------|-----|------------|\n";
      for (const d of state.recentDecisions.slice(0, 7)) {
        output += `| ${d.date} | ${d.what} | ${d.why} | ${d.confidence} |\n`;
      }
      output += "\n";
    }

    const openProblems = state.recentProblems.filter(
      (p) => p.status === "open",
    );
    const resolvedProblems = state.recentProblems.filter(
      (p) => p.status === "resolved",
    );
    if (openProblems.length > 0 || resolvedProblems.length > 0) {
      output += "### Recent Problems\n";
      for (const p of openProblems) {
        output += `- **[OPEN]** ${p.description}\n`;
      }
      for (const p of resolvedProblems.slice(0, 3)) {
        output += `- [RESOLVED] ${p.description} → ${p.resolution ?? "resolved"}\n`;
      }
      output += "\n";
    }

    if (Object.keys(state.techStack).length > 0) {
      output += "### Tech Stack\n";
      for (const [key, value] of Object.entries(state.techStack)) {
        output += `- **${key}:** ${value}\n`;
      }
      output += "\n";
    }

    return output;
  }

  private formatQuickRecall(state: ProjectState): string {
    let output = `## ${state.displayName}\n`;
    output += `Phase: ${state.phase} | Health: ${state.health} | Sessions: ${state.totalSessions}\n`;
    if (state.lastSession !== null) {
      output += `Last: ${state.lastSession.date} — ${state.lastSession.summary}\n`;
    }
    if (state.pendingWork.length > 0) {
      output += `Pending: ${state.pendingWork.join(", ")}\n`;
    }
    if (state.blockers.length > 0) {
      output += `Blockers: ${state.blockers.map((b) => b.description).join("; ")}\n`;
    }
    return output;
  }

  private formatSessionSummary(record: SessionRecord): string {
    let output = `## Session Summary\n`;
    output += `**Project:** ${record.project} | **Duration:** ${record.durationMinutes} min | **Goal:** ${record.goalAchieved}\n\n`;
    output += `**Outcome:** ${record.actualOutcome}\n\n`;

    if (record.decisions.length > 0) {
      output += `### Decisions Made (${record.decisions.length})\n`;
      for (const d of record.decisions) {
        output += `- ${d.what} — ${d.why}\n`;
      }
      output += "\n";
    }

    if (record.lessons.length > 0) {
      output += `### Lessons Learned (${record.lessons.length})\n`;
      for (const l of record.lessons) {
        output += `- ${l}\n`;
      }
      output += "\n";
    }

    if (record.pendingForNext.length > 0) {
      output += "### Pending for Next Session\n";
      for (const item of record.pendingForNext) {
        output += `- ${item}\n`;
      }
    }

    return output;
  }
}

interface SessionExtraction {
  outcome: string;
  goalAchieved: SessionRecord["goalAchieved"];
  decisions: RecentDecision[];
  problems: RecentProblem[];
  lessons: string[];
  pendingWork: string[];
}

export const sessionManager = new SessionManager();
