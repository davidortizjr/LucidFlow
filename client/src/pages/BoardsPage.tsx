import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjects } from "../hooks/useApi";
import CreateTicketModal from "../components/Dashboard/CreateTicketModal";
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DragStart,
    type DropResult
} from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import type { Project, Task, Board } from "../types";
import { buildApiUrl } from "../config/runtimeEndpoints";

function priorityClasses(priority?: string) {
    switch ((priority || "").toUpperCase()) {
        case "HIGH":
        case "URGENT":
            return "bg-error-container text-on-error-container";
        case "LOW":
            return "bg-secondary-fixed text-on-secondary-fixed-variant";
        default:
            return "bg-primary-fixed text-on-primary-fixed-variant";
    }
}

function mapBoardNameToStatus(boardName: string): string | undefined {
    const name = boardName.toUpperCase().replace(/\s+/g, "_");
    if (name.includes("TODO") || name.includes("BACKLOG")) return "TODO";
    if (name.includes("PROGRESS") || name.includes("DOING")) return "IN_PROGRESS";
    if (name.includes("REVIEW") || name.includes("QA")) return "IN_REVIEW";
    if (name.includes("DONE") || name.includes("COMPLETE")) return "DONE";
    return undefined;
}

function normalizePositions(tasks: Task[], boardId: string): Task[] {
    return tasks.map((task, index) => ({ ...task, boardId, position: index }));
}

const taskVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    hover: { y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)" }
};

const boardVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 }
};

export default function BoardsPage() {
    const [searchParams] = useSearchParams();
    const { projects, loading: projectsLoading, error: projectsError } = useProjects();
    const [showCreateModal, setShowCreateModal] = useState(searchParams.get("modal") === "create-ticket");
    const [viewMode, setViewMode] = useState<"kanban" | "timeline" | "list">("kanban");

    // Handle both array and paginated object formats
    const projectsArray = Array.isArray(projects) ? projects : (projects as any)?.data || [];
    const typedProjects = projectsArray as Project[];

    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(false);
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedProjectId && typedProjects.length > 0) {
            setSelectedProjectId(typedProjects[0].id);
        }
    }, [selectedProjectId, typedProjects]);

    const fetchBoards = async () => {
        if (!selectedProjectId) return;
        setLoading(true);
        try {
            const boardsUrl = await buildApiUrl(`/projects/${selectedProjectId}/boards`);
            const response = await fetch(boardsUrl);
            const payload = await response.json();
            setBoards(Array.isArray(payload) ? payload : payload?.data || []);
        } catch {
            setBoards([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoards();
    }, [selectedProjectId]);

    const selectedProject = useMemo(
        () => typedProjects.find((project) => project.id === selectedProjectId),
        [selectedProjectId, typedProjects]
    );

    const allTasks = useMemo(() => {
        return boards.flatMap(board => board.tasks).sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [boards]);

    const handleDragStart = (start: DragStart) => {
        setDraggingTaskId(start.draggableId);
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        setDraggingTaskId(null);

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceBoard = boards.find((board) => board.id === source.droppableId);
        const destinationBoard = boards.find((board) => board.id === destination.droppableId);
        if (!sourceBoard || !destinationBoard) return;

        const sourceTasks = [...sourceBoard.tasks];
        const [movedTask] = sourceTasks.splice(source.index, 1);
        if (!movedTask) return;
        let optimisticBoards: Board[];

        if (source.droppableId === destination.droppableId) {
            sourceTasks.splice(destination.index, 0, movedTask);
            const normalized = normalizePositions(sourceTasks, source.droppableId);
            optimisticBoards = boards.map((board) =>
                board.id === source.droppableId ? { ...board, tasks: normalized } : board
            );
        } else {
            const destinationTasks = [...destinationBoard.tasks];
            destinationTasks.splice(destination.index, 0, movedTask);

            const normalizedSource = normalizePositions(sourceTasks, source.droppableId);
            const normalizedDestination = normalizePositions(destinationTasks, destination.droppableId).map((task) =>
                task.id === movedTask.id
                    ? { ...task, status: mapBoardNameToStatus(destinationBoard.name) }
                    : task
            );

            optimisticBoards = boards.map((board) => {
                if (board.id === source.droppableId) return { ...board, tasks: normalizedSource };
                if (board.id === destination.droppableId) return { ...board, tasks: normalizedDestination };
                return board;
            });
        }

        setBoards(optimisticBoards);

        const targetStatus = mapBoardNameToStatus(destinationBoard.name);

        try {
            const moveUrl = await buildApiUrl(`/tasks/${draggableId}/move`);
            const response = await fetch(moveUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceBoardId: source.droppableId,
                    destinationBoardId: destination.droppableId,
                    sourceIndex: source.index,
                    destinationIndex: destination.index,
                    status: targetStatus
                })
            });

            if (!response.ok) {
                throw new Error(`Move request failed: ${response.status}`);
            }
        } catch {

            const taskUrl = await buildApiUrl(`/tasks/${draggableId}`);
            const fallbackResponse = await fetch(taskUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boardId: destination.droppableId,
                    position: destination.index,
                    ...(targetStatus ? { status: targetStatus } : {})
                })
            });

            if (!fallbackResponse.ok) {
                setBoards(boards);
            }
        }
    };

    return (
        <>
            <main className="md:ml-64 pt-16 bg-background text-on-surface">
                <div className="px-6 pb-12 pt-8">
                    <header className="mb-8 mt-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <nav className="flex items-center gap-2 text-xs font-semibold text-outline mb-2 uppercase tracking-widest">
                                    <span>Workspace</span>
                                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                                    <span>{selectedProject?.name || "Project"}</span>
                                </nav>
                                <h1 className="text-5xl font-extrabold font-manrope tracking-tighter text-on-surface">Main Sprint Board</h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Create Ticket
                                </button>
                                <div className="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-full">
                                    <button
                                        onClick={() => setViewMode("kanban")}
                                        className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${viewMode === "kanban" ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}>Kanban</button>
                                    <button
                                        onClick={() => setViewMode("timeline")}
                                        className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${viewMode === "timeline" ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}>Timeline</button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${viewMode === "list" ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}>List</button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="mb-6 flex items-center gap-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="project-select">
                            Project
                        </label>
                        <select
                            id="project-select"
                            value={selectedProjectId}
                            onChange={(event) => setSelectedProjectId(event.target.value)}
                            className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm"
                        >
                            {typedProjects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {projectsLoading || loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="bg-surface-container-lowest p-6 rounded-xl animate-pulse h-64" />
                            ))}
                        </div>
                    ) : projectsError ? (
                        <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm">{projectsError}</div>
                    ) : viewMode === "kanban" ? (
                        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar items-start">

                                {boards.map((board) => (
                                    <motion.section
                                        key={board.id}
                                        className="flex-shrink-0 w-80 flex flex-col gap-4"
                                        variants={boardVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="initial"
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-manrope font-extrabold text-sm text-on-surface-variant tracking-wider uppercase">{board.name}</h3>
                                                <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {board.tasks.length}
                                                </span>
                                            </div>
                                        </div>

                                        <Droppable droppableId={board.id} type="TASK">
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`space-y-4 rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? "bg-surface-container-lowest/50 border-2 border-primary" : ""}`}
                                                >

                                                    {board.tasks.length === 0 ? (
                                                        <div className="bg-surface-container-lowest p-5 rounded-xl text-sm text-on-surface-variant text-center">No tasks in this board.</div>
                                                    ) : (
                                                        board.tasks.map((task, index) => (
                                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={provided.draggableProps.style}
                                                                    >
                                                                        <motion.div
                                                                            className={`bg-surface-container-lowest p-5 rounded-xl group cursor-grab transition-all ${snapshot.isDragging ? "shadow-2xl opacity-70" : ""} ${draggingTaskId === task.id ? "ring-2 ring-primary" : ""}`}
                                                                            variants={taskVariants}
                                                                            initial="initial"
                                                                            animate="animate"
                                                                            exit="exit"
                                                                            whileHover={snapshot.isDragging ? undefined : "hover"}
                                                                            transition={{ duration: 0.2 }}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                                                <span className={`${priorityClasses(task.priority)} text-[10px] font-bold px-2 py-1 rounded-md uppercase`}>
                                                                                    {task.priority || "Medium"}
                                                                                </span>
                                                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-on-surface" type="button">
                                                                                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                                                                                </button>
                                                                            </div>

                                                                            <h4 className="font-manrope font-bold text-on-surface mb-2 leading-snug">{task.title}</h4>
                                                                            {task.description && <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{task.description}</p>}

                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex -space-x-2">
                                                                                    {task.assignedTo?.avatar ? (
                                                                                        <img
                                                                                            alt="Assignee"
                                                                                            className="w-6 h-6 rounded-full border-2 border-surface-container-lowest"
                                                                                            src={task.assignedTo.avatar}
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container" />
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px] font-semibold">
                                                                                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                                                                                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))
                                                    )}

                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </motion.section>
                                ))}

                            </div>
                        </DragDropContext>
                    ) : viewMode === "timeline" ? (
                        <div className="space-y-4">
                            {allTasks.length === 0 ? (
                                <div className="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant">No tasks available</div>
                            ) : (
                                <div className="space-y-3">
                                    {allTasks.map((task) => {
                                        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                                        const today = new Date();
                                        const isOverdue = dueDate && dueDate < today;
                                        const isToday = dueDate && dueDate.toDateString() === today.toDateString();
                                        const isSoon = dueDate && dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000;

                                        return (
                                            <motion.div
                                                key={task.id}
                                                className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-all"
                                                variants={taskVariants}
                                                initial="initial"
                                                animate="animate"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-shrink-0 w-24">
                                                        {dueDate && (
                                                            <div className={`text-center p-2 rounded-lg ${isOverdue ? "bg-error-container text-on-error-container" : isToday ? "bg-primary-fixed text-primary" : isSoon ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container"}`}>
                                                                <div className="text-xs font-semibold">{dueDate.toLocaleDateString()}</div>
                                                                <div className="text-[10px]">{dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start gap-2 mb-1">
                                                            <span className={`${priorityClasses(task.priority)} text-[10px] font-bold px-2 py-1 rounded-md uppercase flex-shrink-0`}>
                                                                {task.priority || "Medium"}
                                                            </span>
                                                            {isOverdue && (
                                                                <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-error-container text-on-error-container uppercase">Overdue</span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold text-on-surface mb-1">{task.title}</h4>
                                                        {task.description && <p className="text-sm text-on-surface-variant line-clamp-2">{task.description}</p>}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {task.assignedTo?.avatar ? (
                                                            <img
                                                                alt="Assignee"
                                                                className="w-8 h-8 rounded-full border-2 border-outline-variant"
                                                                src={task.assignedTo.avatar}
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full border-2 border-outline-variant bg-surface-container" />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-surface-container-lowest rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-outline-variant">
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-on-surface-variant">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-on-surface-variant">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-on-surface-variant">Priority</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-on-surface-variant">Due Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase text-on-surface-variant">Assignee</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No tasks available</td>
                                            </tr>
                                        ) : (
                                            allTasks.map((task) => (
                                                <tr key={task.id} className="border-b border-outline-variant hover:bg-surface-container-high transition-colors">
                                                    <td className="px-6 py-3 text-sm font-medium text-on-surface">{task.title}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="inline-block px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">{task.status || "TODO"}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={`${priorityClasses(task.priority)} text-[10px] font-bold px-2 py-1 rounded-md uppercase inline-block`}>
                                                            {task.priority || "Medium"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-on-surface">
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {task.assignedTo?.avatar ? (
                                                                <img
                                                                    alt="Assignee"
                                                                    className="w-6 h-6 rounded-full"
                                                                    src={task.assignedTo.avatar}
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-surface-container" />
                                                            )}
                                                            <span className="text-sm text-on-surface-variant">{task.assignedTo?.name || "Unassigned"}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {/* Create Ticket Modal */}
            {
                showCreateModal && (
                    <CreateTicketModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onTicketCreated={fetchBoards}
                    />
                )
            }
        </>
    );
}