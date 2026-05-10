import Today from "@/components/containers/today";
import MobileNav from "@/components/nav/mobile-nav";
import SideBar from "@/components/nav/side-bar";
import TodoList from "@/components/todos/todo-list";

export default function Home() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] bg-zinc-950 text-zinc-100">
      <SideBar />
      <div className="flex flex-col min-w-0">
        <MobileNav />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:px-8">
          <Today />
        </main>
      </div>
    </div>
  );
}
