"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  BrainCircuit,
  CheckSquare,
  ClipboardList,
  ListChecks,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { AICopilotPlan, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea, Select, Label } from "@/components/ui/input";
import { DEPARTMENTS } from "@/lib/config";
import { useToast } from "@/components/ui/toast";
import type { EventFormValues } from "@/components/event/event-form";

export default function CopilotPanel({
  categories,
  onApply,
}: {
  categories: Category[];
  onApply: (v: Partial<EventFormValues>) => void;
}) {
  const [topic, setTopic] = React.useState("A one-day hands-on gen-AI hackathon where teams build an AI assistant for students.");
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? "");
  const [department, setDepartment] = React.useState("");
  const [plan, setPlan] = React.useState<AICopilotPlan | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const { push } = useToast();

  const generate = async () => {
    if (topic.trim().length < 3) {
      push("Describe the event idea first.", "error");
      return;
    }
    setLoading(true);
    setApplied(false);
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, categoryId, department: department || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate a plan.");
      setPlan(data);
    } catch (err) {
      push(err instanceof Error ? err.message : "Copilot is unavailable right now.", "error");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!plan) return;
    onApply({
      title: plan.title,
      description: plan.description,
      categoryId: plan.categoryId,
      capacity: String(plan.capacity),
      department: plan.department,
      targetAudience: plan.targetAudience,
      agenda: plan.agenda,
      resources: plan.resources,
      skillLevel: "beginner",
    });
    setApplied(true);
    push("Plan applied to the form — review and submit below.", "success");
  };

  return (
    <Card className="overflow-hidden border-violet-100">
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
          <BrainCircuit className="size-5" />
        </div>
        <div>
          <p className="text-sm font-bold">AI Event Copilot</p>
          <p className="text-xs text-violet-100">
            Describe an idea — get a complete event plan in seconds.
          </p>
        </div>
        {plan?.source === "gemini" && (
          <Badge className="ml-auto bg-white/15 px-2 py-1 text-white hover:bg-white/15">
            <Sparkles className="size-3" /> Gemini
          </Badge>
        )}
      </div>

      <div className="p-5">
        <Label>What kind of event do you want to run?</Label>
        <Textarea
          className="min-h-20"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. A 2-day AI workshop for all departments…"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Audience (optional)</Label>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="gradient" size="sm" onClick={generate} loading={loading}>
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {plan ? "Generate Again" : "Generate Event Plan"}
          </Button>
          {plan && !applied && (
            <Button variant="success" size="sm" onClick={apply}>
              <ArrowDownToLine className="size-4" />
              Use This Plan
            </Button>
          )}
        </div>

        {plan && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div>
              <p className="text-lg font-bold text-slate-900">{plan.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{plan.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Category" value={plan.category} />
              <MiniStat label="Capacity" value={String(plan.capacity)} />
              <MiniStat label="Audience" value={plan.targetAudience || "All"} />
              <MiniStat label="Department" value={plan.department || "All"} />
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <ListChecks className="size-3.5" /> Agenda
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{plan.agenda}</p>
            </div>

            {plan.resources && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <ClipboardList className="size-3.5" /> Resources / Prerequisites
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{plan.resources}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plan.risks.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="size-3.5" /> Potential Risks
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-amber-900">
                    {plan.risks.map((r) => (
                      <li key={r} className="flex gap-1.5">
                        <span className="mt-1 size-1 shrink-0 rounded-full bg-amber-400" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.preparationSteps.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckSquare className="size-3.5" /> Preparation Steps
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-emerald-900">
                    {plan.preparationSteps.map((s) => (
                      <li key={s} className="flex gap-1.5">
                        <CheckSquare className="mt-0.5 size-3 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Card className="border-violet-100 bg-violet-50/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
                <Sparkles className="size-3.5" /> Suggested promotion message
              </p>
              <p className="mt-1.5 text-sm text-violet-900">{plan.promotionMessage}</p>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}