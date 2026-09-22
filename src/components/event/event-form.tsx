"use client";

import * as React from "react";
import { CalendarDays, Loader2, Save } from "lucide-react";
import type { Category, EventInput, SkillLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/config";
import { Input, Textarea, Label, Select, Field } from "@/components/ui/input";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string {
  return new Date(value).toISOString();
}

export interface EventFormValues {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  eventDate: string;
  endTime: string;
  registrationDeadline: string;
  capacity: string;
  skillLevel: SkillLevel;
  department: string;
  targetAudience: string;
  agenda: string;
  resources: string;
}

interface EventFormProps {
  categories: Category[];
  initialValues?: Partial<EventInput> & { capacity?: number };
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: EventInput) => Promise<void>;
}

export interface EventFormHandle {
  setValues: (v: Partial<EventFormValues>) => void;
}

export const EventForm = React.forwardRef<EventFormHandle, EventFormProps>(function EventForm(
  { categories, initialValues, submitLabel = "Create Event", submitting, onSubmit },
  ref
) {
  const [values, setValuesState] = React.useState<EventFormValues>({
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    categoryId: initialValues?.categoryId ?? categories[0]?.id ?? "",
    location: initialValues?.location ?? "",
    eventDate: initialValues?.eventDate ? toLocalInputValue(initialValues.eventDate) : "",
    endTime: initialValues?.endTime ? toLocalInputValue(initialValues.endTime) : "",
    registrationDeadline: initialValues?.registrationDeadline
      ? toLocalInputValue(initialValues.registrationDeadline)
      : "",
    capacity: initialValues?.capacity != null ? String(initialValues.capacity) : "",
    skillLevel: initialValues?.skillLevel ?? "beginner",
    department: initialValues?.department ?? "",
    targetAudience: initialValues?.targetAudience ?? "",
    agenda: initialValues?.agenda ?? "",
    resources: initialValues?.resources ?? "",
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useImperativeHandle(ref, () => ({
    setValues: (v) => setValuesState((prev) => ({ ...prev, ...v })),
  }));

  const set = (key: keyof EventFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValuesState((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const title = values.title.trim();
    const description = values.description.trim();
    const location = values.location.trim();
    const capacity = Number(values.capacity);
    const eventDate = values.eventDate ? new Date(values.eventDate).getTime() : null;
    const deadline = values.registrationDeadline ? new Date(values.registrationDeadline).getTime() : null;

    if (title.length < 3) return setError("Title must be at least 3 characters.");
    if (description.length < 20) return setError("Description should be at least 20 characters.");
    if (!values.categoryId) return setError("Please choose a category.");
    if (location.length < 3) return setError("Please enter a location.");
    if (!eventDate) return setError("Please choose an event date and time.");
    if (eventDate <= Date.now()) return setError("Event date must be in the future.");
    if (!deadline) return setError("Please set a registration deadline.");
    if (deadline >= eventDate) return setError("Registration deadline must be before the event date.");
    if (!capacity || capacity < 1 || capacity > 2000) return setError("Capacity must be between 1 and 2000.");

    await onSubmit({
      title,
      description,
      categoryId: values.categoryId,
      location,
      eventDate: fromLocalInputValue(values.eventDate),
      endTime: values.endTime ? fromLocalInputValue(values.endTime) : fromLocalInputValue(values.eventDate),
      registrationDeadline: fromLocalInputValue(values.registrationDeadline),
      capacity,
      skillLevel: values.skillLevel,
      department: values.department,
      targetAudience: values.targetAudience.trim(),
      agenda: values.agenda.trim(),
      resources: values.resources.trim(),
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      throw err;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && (
        <div className="col-span-full rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Field className="sm:col-span-2">
        <Label>Event Title</Label>
        <Input placeholder="e.g. AI & Machine Learning Workshop" value={values.title} onChange={set("title")} />
      </Field>

      <Field className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea
          placeholder="What will attendees learn? What should they bring?"
          value={values.description}
          onChange={set("description")}
        />
      </Field>

      <Field>
        <Label>Category</Label>
        <Select value={values.categoryId} onChange={set("categoryId")}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Skill Level</Label>
        <Select value={values.skillLevel} onChange={set("skillLevel")}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="all">All Levels</option>
        </Select>
      </Field>

      <Field>
        <Label>Location</Label>
        <Input placeholder="Innovation Hall · Room 204" value={values.location} onChange={set("location")} />
      </Field>

      <Field>
        <Label>Capacity</Label>
        <Input type="number" min={1} max={2000} placeholder="60" value={values.capacity} onChange={set("capacity")} />
      </Field>

      <Field>
        <Label>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-violet-500" />
            Event Date &amp; Time
          </span>
        </Label>
        <Input
          type="datetime-local"
          value={values.eventDate}
          onChange={set("eventDate")}
        />
      </Field>

      <Field>
        <Label>Registration Deadline</Label>
        <Input
          type="datetime-local"
          value={values.registrationDeadline}
          onChange={set("registrationDeadline")}
        />
      </Field>

      <Field>
        <Label>End Time</Label>
        <Input
          type="datetime-local"
          value={values.endTime}
          onChange={set("endTime")}
        />
      </Field>

      <Field>
        <Label>Department</Label>
        <Select value={values.department} onChange={set("department")}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>Target Audience</Label>
        <Input placeholder="e.g. CSE / IT 2nd & 3rd year" value={values.targetAudience} onChange={set("targetAudience")} />
      </Field>

      <Field className="sm:col-span-2">
        <Label>Agenda</Label>
        <Textarea
          placeholder={"09:00 – Welcome\n09:30 – Main session\n11:00 – Hands-on lab"}
          value={values.agenda}
          onChange={set("agenda")}
        />
      </Field>

      <Field className="sm:col-span-2">
        <Label>Resources / Prerequisites</Label>
        <Textarea
          placeholder="What should attendees bring?"
          value={values.resources}
          onChange={set("resources")}
        />
      </Field>

      <div className="col-span-full mt-1">
        <Button type="submit" variant="gradient" size="lg" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {submitLabel}
        </Button>
        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
          New events go to review before appearing publicly.
        </span>
      </div>
    </form>
  );
});