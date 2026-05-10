import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { EllipsisIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";

export default function DeleteProject({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const form = useForm({ defaultValues: { name: "" } });
  const { toast } = useToast();
  const router = useRouter();

  const project = useQuery(api.projects.getProjectByProjectId, { projectId });
  const deleteProject = useAction(api.projects.deleteProjectAndItsTasks);

  const onSubmit = async () => {
    if (project?.type === "system") {
      toast({
        title: "🤗 Just a reminder",
        description: "System projects are protected from deletion.",
        duration: 3000,
      });
      return;
    }
    const deleteTaskId = await deleteProject({ projectId });
    if (deleteTaskId !== undefined) {
      toast({
        title: "🗑️ Project deleted",
        duration: 3000,
      });
      router.push(`/loggedin/projects`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <EllipsisIcon className="w-5 h-5 text-foreground hover:cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="w-40 lg:w-56">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <button type="submit" className="flex gap-2">
              <Trash2 className="w-5 h-5 rotate-45 text-foreground/40" /> Delete
              Project
            </button>
          </form>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
