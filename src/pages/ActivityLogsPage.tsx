import {
  activityApi,
  workspaceApi,
  type IActivityActionGroup,
  type IActivityActor,
  type IActivityLogItem,
  type ISearchPagination,
  type IWorkspaceDetailResponse,
  type WorkspaceItem,
} from "@/api/api";
import { ActivityLogFilters } from "@/components/ActivityLogFilters";
import { ActivityLogPagination } from "@/components/ActivityLogPagination";
import { ActivityLogTable } from "@/components/ActivityLogTable";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import Header from "@/components/ui/Header";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useParams } from "react-router-dom";

const PAGE_SIZE = 20;

const initialPagination: ISearchPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function ActivityLogPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] =
    useState<IWorkspaceDetailResponse | null>(null);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actors, setActors] = useState<IActivityActor[]>([]);
  const [actionCategories, setActionCategories] = useState<
    IActivityActionGroup[]
  >([]);
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activities, setActivities] = useState<IActivityLogItem[]>([]);
  const [pagination, setPagination] =
    useState<ISearchPagination>(initialPagination);
  const [page, setPage] = useState(1);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!workspaceId) return;

      try {
        const [detailRes, listRes] = await Promise.all([
          workspaceApi.getById(workspaceId),
          workspaceApi.getAll(),
        ]);

        setWorkspace(detailRes.data);
        setWorkspaceList(listRes.data);
      } catch (error) {
        console.error("Failed to fetch workspace data:", error);
      }
    };

    fetchWorkspaceData();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const controller = new AbortController();

    setSelectedActorIds([]);
    setSelectedActionIds([]);
    setDateRange(undefined);
    setPage(1);
    setIsLoadingOptions(true);

    Promise.all([
      activityApi.getActorsByWorkspace(workspaceId, {
        signal: controller.signal,
      }),
      activityApi.getActions({
        signal: controller.signal,
      }),
    ])
      .then(([actorRes, actionRes]) => {
        setActors(actorRes.data);
        setActionCategories(actionRes.data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch activity filter options:", error);
          setActors([]);
          setActionCategories([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingOptions(false);
        }
      });

    return () => controller.abort();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const controller = new AbortController();

    setIsLoadingActivities(true);

    activityApi
      .getLogsByWorkspace(
        workspaceId,
        {
          actorIds:
            selectedActorIds.length > 0 ? selectedActorIds : undefined,
          actionIds:
            selectedActionIds.length > 0 ? selectedActionIds : undefined,
          createdFrom: dateRange?.from
            ? startOfDay(dateRange.from)
            : undefined,
          createdTo: dateRange?.to ? endOfDay(dateRange.to) : undefined,
          page,
          pageSize: PAGE_SIZE,
        },
        {
          signal: controller.signal,
        }
      )
      .then((response) => {
        setActivities(response.data.items);
        setPagination(response.data.pagination);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch activity logs:", error);
          setActivities([]);
          setPagination({
            ...initialPagination,
            page,
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingActivities(false);
        }
      });

    return () => controller.abort();
  }, [
    workspaceId,
    selectedActorIds,
    selectedActionIds,
    dateRange,
    page,
  ]);

  const handleActorIdsChange = (actorIds: string[]) => {
    setSelectedActorIds(actorIds);
    setPage(1);
  };

  const handleActionIdsChange = (actionIds: string[]) => {
    setSelectedActionIds(actionIds);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header showSearch={true} className="shrink-0" />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <WorkspaceSidebar
          workspaceId={workspaceId}
          workspace={workspace}
          workspaceList={workspaceList}
          activeTab="activity"
          onCreateWorkspaceClick={() => setIsModalOpen(true)}
        />

        {/* MAIN CONTENT (SETTINGS) */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-8 py-6">
          <div className="flex shrink-0 flex-col gap-4 pt-sm pb-2.5">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Activity log
            </h1>

            <ActivityLogFilters
              actors={actors}
              actionCategories={actionCategories}
              selectedActorIds={selectedActorIds}
              selectedActionIds={selectedActionIds}
              dateRange={dateRange}
              isLoadingOptions={isLoadingOptions}
              onActorIdsChange={handleActorIdsChange}
              onActionIdsChange={handleActionIdsChange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <ActivityLogTable
              activities={activities}
              isLoading={isLoadingActivities}
            />
          </div>

          <div className="mt-auto flex shrink-0 justify-center">
            <ActivityLogPagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        </main>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          try {
            const res = await workspaceApi.getAll();
            setWorkspaceList(res.data);
          } catch (error) {
            console.error("Failed to fetch workspace list:", error);
          }
        }}
      />
    </div>
  );
}
