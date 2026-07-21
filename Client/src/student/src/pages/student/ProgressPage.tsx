import { useEffect, useState } from "react";
import { projectApi } from "@/api/projects";
import { chapterApi } from "@/api/chapters";
import { taskApi } from "@/api/tasks";
import type { Project, Chapter } from "@/types";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface ChapterProgress {
  chapter: Chapter;
  taskCompletion: number; // 0-100
}

export function ProgressPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<ChapterProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProject, setNoProject] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const projectRes = await projectApi.myProject();
        setProject(projectRes.data.data);

        const chaptersRes = await chapterApi.list(projectRes.data.data._id);
        const results = await Promise.all(
          chaptersRes.data.data.map(async (chapter) => {
            const tasksRes = await taskApi.listByChapter(chapter._id);
            const tasks = tasksRes.data.data;
            const allItems = tasks.flatMap((t) => t.checklist);
            const completedItems = allItems.filter((i) => i.isCompleted).length;
            const taskCompletion = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0;
            return { chapter, taskCompletion };
          })
        );
        setProgress(results);
      } catch {
        setNoProject(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (noProject || !project) {
    return (
      <div>
        <PageHeader title="Progress" />
        <EmptyState title="No project assigned yet" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Progress" description={project.title} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Overall completion" value={`${project.completionPercentage}%`} />
        <StatCard label="Chapters" value={progress.length} />
        <StatCard
          label="Chapters at 100% checklist"
          value={progress.filter((p) => p.taskCompletion === 100).length}
        />
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Chapter progress</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-gray-400">No chapters yet.</p>
        ) : (
          <div className="space-y-4">
            {progress.map(({ chapter, taskCompletion }) => (
              <div key={chapter._id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{chapter.title}</span>
                  <span className="text-gray-500">{taskCompletion}% of tasks complete</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${taskCompletion}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
