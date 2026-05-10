"use client";
import MobileNav from "@/components/nav/mobile-nav";
import SideBar from "@/components/nav/side-bar";
import Todos from "@/components/todos/todos";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

export default function Search() {
  const { searchQuery } = useParams<{ searchQuery: string }>();
  const decoded = decodeURIComponent(searchQuery);

  const results = useQuery(api.search.searchTasks, { query: decoded }) ?? [];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SideBar />
      <div className="flex flex-col">
        <MobileNav />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:px-8">
          <div className="xl:px-40">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold md:text-2xl">
                Search results for <span>{`"${decoded}"`}</span>
              </h1>
            </div>

            <div className="flex flex-col gap-1 py-4">
              <Todos items={results.filter((t) => !t.isCompleted)} />
              {results.length === 0 && (
                <p className="text-sm text-muted-foreground py-6">
                  No tasks match {`"${decoded}"`}.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
