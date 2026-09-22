import type { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "cat-ai",
    name: "Artificial Intelligence",
    slug: "ai",
    description: "Machine learning, LLMs, computer vision and intelligent systems.",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "cat-ds",
    name: "Data Science",
    slug: "data-science",
    description: "Analytics, statistics, visualization and data-driven insights.",
    accent: "from-sky-500 to-blue-600",
  },
  {
    id: "cat-web",
    name: "Web Development",
    slug: "web-development",
    description: "Frontend, backend, full-stack and everything on the web.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "cat-cyber",
    name: "Cybersecurity",
    slug: "cybersecurity",
    description: "Ethical hacking, security operations and digital defense.",
    accent: "from-rose-500 to-red-600",
  },
  {
    id: "cat-robotics",
    name: "Robotics",
    slug: "robotics",
    description: "Hardware, automation, embedded systems and robot design.",
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "cat-entrep",
    name: "Entrepreneurship",
    slug: "entrepreneurship",
    description: "Startups, product thinking, funding and go-to-market.",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "cat-design",
    name: "Design",
    slug: "design",
    description: "UI/UX, product design, prototyping and design systems.",
    accent: "from-cyan-500 to-sky-600",
  },
  {
    id: "cat-cloud",
    name: "Cloud Computing",
    slug: "cloud",
    description: "Infrastructure, DevOps, containers and serverless.",
    accent: "from-indigo-500 to-blue-700",
  },
  {
    id: "cat-programming",
    name: "Programming",
    slug: "programming",
    description: "Coding, algorithms, competitive programming and best practice.",
    accent: "from-lime-500 to-green-600",
  },
];

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}