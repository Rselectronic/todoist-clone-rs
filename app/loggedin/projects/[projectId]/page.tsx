"use client";
import BoardView from "@/components/board/board-view";
import MobileNav from "@/components/nav/mobile-nav";
import SideBar from "@/components/nav/side-bar";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";

export default function ProjectIdPage() {
  const { projectId } = useParams<{ projectId: Id<"projects"> }>();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] bg-zinc-950 text-zinc-100">
      <SideBar />
      <div className="flex flex-col min-w-0">
        <MobileNav navTitle={"My Projects"} navLink="/loggedin/projects" />
        <main className="flex-1 min-h-0">
          <BoardView projectId={projectId} />
        </main>
      </div>
    </div>
  );
}
