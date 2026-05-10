"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  BarChart3,
  CalendarDays,
  Calendar,
  Filter,
  Hash,
  Inbox,
  Plus,
  Search,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogTrigger } from "../ui/dialog";
import AddProjectDialog from "../projects/add-project-dialog";
import AddLabelDialog from "../labels/add-label-dialog";
import UserProfile from "./user-profile";
import { Doc } from "@/convex/_generated/dataModel";

const primaryNav = [
  { name: "Search", icon: Search, href: "/loggedin/search" },
  { name: "Inbox", icon: Inbox, href: "/loggedin" },
  { name: "Today", icon: Calendar, href: "/loggedin/today" },
  { name: "Upcoming", icon: CalendarDays, href: "/loggedin/upcoming" },
  { name: "Filters & Labels", icon: Filter, href: "/loggedin/filter-labels" },
  { name: "Reporting", icon: BarChart3, href: "/loggedin/reporting" },
];

function projectColorDot(color?: string): string {
  switch (color) {
    case "red":
      return "text-rose-500";
    case "amber":
      return "text-amber-400";
    case "blue":
      return "text-sky-400";
    case "violet":
      return "text-violet-400";
    case "emerald":
      return "text-emerald-400";
    default:
      return "text-zinc-500";
  }
}

export default function SideBar() {
  const pathname = usePathname();
  const projects = useQuery(api.projects.getProjects) ?? [];
  const workspaces = useQuery(api.workspaces.getMyWorkspaces) ?? [];

  const favorites = projects.filter((p) => p.isFavorite);
  const userProjects = projects.filter(
    (p) => p.type === "user" && !p.workspaceId
  );
  const projectsByWorkspace = new Map<string, typeof projects>();
  for (const p of projects.filter((p) => p.workspaceId)) {
    const key = p.workspaceId as string;
    const arr = projectsByWorkspace.get(key) ?? [];
    arr.push(p);
    projectsByWorkspace.set(key, arr);
  }

  return (
    <aside className="hidden md:flex flex-col bg-zinc-950 border-r border-zinc-900 text-zinc-200 h-screen sticky top-0">
      <div className="px-3 py-3 border-b border-zinc-900">
        <UserProfile />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="space-y-0.5">
          {primaryNav.map(({ name, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm",
                pathname === href
                  ? "bg-rose-500/10 text-rose-300"
                  : "text-zinc-300 hover:bg-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </Link>
          ))}
        </nav>

        {favorites.length > 0 && (
          <Section title="Favorites" icon={Star}>
            {favorites.map((p) => (
              <ProjectLink key={p._id} project={p} pathname={pathname} />
            ))}
          </Section>
        )}

        <Section
          title="My Projects"
          action={
            <Dialog>
              <DialogTrigger className="text-zinc-500 hover:text-zinc-300">
                <Plus className="h-4 w-4" />
              </DialogTrigger>
              <AddProjectDialog />
            </Dialog>
          }
        >
          {userProjects.map((p) => (
            <ProjectLink key={p._id} project={p} pathname={pathname} />
          ))}
        </Section>

        {workspaces.map((ws) => (
          <Section key={ws._id} title={ws.name} icon={Users}>
            {(projectsByWorkspace.get(ws._id) ?? []).map((p) => (
              <ProjectLink key={p._id} project={p} pathname={pathname} />
            ))}
          </Section>
        ))}

        <div className="mt-4 px-2.5">
          <Dialog>
            <DialogTrigger className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300">
              <Plus className="h-3.5 w-3.5" />
              Add label
            </DialogTrigger>
            <AddLabelDialog />
          </Dialog>
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: typeof Star;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between px-2.5 mb-1">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-500">
          {Icon && <Icon className="h-3 w-3" />}
          <span>{title}</span>
        </div>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ProjectLink({
  project,
  pathname,
}: {
  project: Doc<"projects">;
  pathname: string | null;
}) {
  const href = `/loggedin/projects/${project._id}`;
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm",
        active
          ? "bg-rose-500/10 text-rose-300"
          : "text-zinc-300 hover:bg-zinc-900"
      )}
    >
      <Hash className={cn("h-4 w-4", projectColorDot(project.color))} />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
