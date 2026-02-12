"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";

interface Task {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  material_estimate: string | null;
  time_estimate: string | null;
  difficulty: string | null;
  completed: number;
  created_at: string;
}

const COMMON_LOCATIONS = ["Kitchen", "Bathroom", "Bedroom", "Living Room", "Garage", "Yard", "Basement", "Attic"];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMaterial, setFormMaterial] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("");
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);

  const recentLocations = [...new Set(tasks.map((t) => t.location).filter(Boolean))] as string[];

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTasks(data.tasks);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormLocation("");
    setFormMaterial("");
    setFormTime("");
    setFormDifficulty("");
  }

  function openAdd() {
    resetForm();
    setEditingTask(null);
    setShowAdd(true);
  }

  function openEdit(task: Task) {
    setFormName(task.name);
    setFormDesc(task.description || "");
    setFormLocation(task.location || "");
    setFormMaterial(task.material_estimate || "");
    setFormTime(task.time_estimate || "");
    setFormDifficulty(task.difficulty || "");
    setEditingTask(task);
    setShowAdd(true);
  }

  async function fetchEstimates() {
    if (!formName.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch("/api/tasks/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setFormMaterial(data.materialEstimate);
        setFormTime(data.timeEstimate);
        setFormDifficulty(data.difficulty);
      }
    } finally {
      setEstimating(false);
    }
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingTask) {
        await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            description: formDesc || null,
            location: formLocation || null,
            material_estimate: formMaterial || null,
            time_estimate: formTime || null,
            difficulty: formDifficulty || null,
          }),
        });
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            description: formDesc,
            location: formLocation,
          }),
        });
        if (res.ok && formMaterial) {
          const data = await res.json();
          await fetch(`/api/tasks/${data.task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              material_estimate: formMaterial,
              time_estimate: formTime,
              difficulty: formDifficulty,
            }),
          });
        }
      }
      setShowAdd(false);
      resetForm();
      fetchTasks();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchTasks();
  }

  // Group tasks by location
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const loc = task.location || "No Location";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(task);
    return acc;
  }, {});

  const difficultyColor = (d: string | null) => {
    if (!d) return "neutral" as const;
    const lower = d.toLowerCase();
    if (lower.includes("easy")) return "mint" as const;
    if (lower.includes("hard")) return "pop" as const;
    return "honey" as const;
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading tasks...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-honey-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black">My Honey-Do List</h1>
            <p className="text-gray-600 text-sm">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button onClick={openAdd}>+ Add Task</Button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-black mb-2">No tasks yet!</h2>
            <p className="text-gray-600 mb-4">Add your first home-improvement task to get started.</p>
            <Button onClick={openAdd}>Add Your First Task</Button>
          </Card>
        ) : (
          Object.entries(grouped).map(([location, locationTasks]) => (
            <div key={location} className="mb-6">
              <h2 className="text-lg font-black mb-3 flex items-center gap-2">
                <span className="text-xl">📍</span> {location}
                <Badge variant="neutral">{locationTasks.length}</Badge>
              </h2>
              <div className="space-y-3">
                {locationTasks.map((task) => (
                  <Card key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{task.name}</h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.difficulty && (
                          <Badge variant={difficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                        )}
                        {task.time_estimate && (
                          <Badge variant="dew">{task.time_estimate}</Badge>
                        )}
                        {task.material_estimate && (
                          <Badge variant="honey">{task.material_estimate}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(task.id)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editingTask ? "Edit Task" : "Add Task"}
      >
        <div className="space-y-4">
          <Input
            id="taskName"
            label="Task Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder='e.g., "Fix the leaky faucet"'
          />

          <Input
            id="taskDesc"
            label="Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="What needs to be done?"
          />

          <div>
            <label htmlFor="taskLocation" className="block text-sm font-bold mb-1">
              Location
            </label>
            <select
              id="taskLocation"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded bg-white focus:outline-none focus:ring-2 focus:ring-honey-400"
            >
              <option value="">Select location...</option>
              {recentLocations.length > 0 && (
                <optgroup label="Recent">
                  {recentLocations.map((loc) => (
                    <option key={`recent-${loc}`} value={loc}>{loc}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Common">
                {COMMON_LOCATIONS.filter((l) => !recentLocations.includes(l)).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </optgroup>
            </select>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded bg-white focus:outline-none focus:ring-2 focus:ring-honey-400 mt-2"
              placeholder="Or type a custom location..."
            />
          </div>

          {/* AI Estimates */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-dew-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">AI Estimates</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchEstimates}
                disabled={estimating || !formName.trim()}
              >
                {estimating ? "Thinking..." : "Generate"}
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                id="material"
                label="Materials Cost"
                value={formMaterial}
                onChange={(e) => setFormMaterial(e.target.value)}
                placeholder="e.g., $25 - $50"
              />
              <Input
                id="time"
                label="Time Estimate"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="e.g., 1 - 2 hours"
              />
              <Input
                id="difficulty"
                label="Difficulty"
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
                placeholder="e.g., Easy, Medium, Hard"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !formName.trim()} className="flex-1">
              {saving ? "Saving..." : editingTask ? "Save Changes" : "Add Task"}
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
