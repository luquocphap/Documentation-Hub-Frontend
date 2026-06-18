import {
  activityApi,
  workspaceApi,
  type ActivityActionCode,
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
import { createActivitySocket } from "@/lib/socket";
import { endOfDay, startOfDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useParams } from "react-router-dom";

const PAGE_SIZE = 20;
const MAX_REALTIME_CACHE_SIZE = 100;

const initialPagination: ISearchPagination = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

interface RealtimeActivityState {
  page: number;
  actorIds: string[];
  actionCodes: ActivityActionCode[];
  dateRange: DateRange | undefined;
}

interface CachedRealtimeActivity {
  activity: IActivityLogItem;
  sequence: number;
}

function buildPagination(
  pagination: ISearchPagination,
  additionalItems: number
): ISearchPagination {
  const total = pagination.total + additionalItems;
  const totalPages = Math.ceil(total / pagination.pageSize);

  return {
    ...pagination,
    total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1 && totalPages > 0,
  };
}

function matchesCurrentFilters(
  activity: IActivityLogItem,
  state: RealtimeActivityState
) {
  if (
    state.actorIds.length > 0 &&
    !state.actorIds.includes(activity.actorId)
  ) {
    return false;
  }

  if (
    state.actionCodes.length > 0 &&
    !state.actionCodes.includes(activity.actionCode)
  ) {
    return false;
  }

  const createdAt = new Date(activity.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  if (
    state.dateRange?.from &&
    createdAt < startOfDay(state.dateRange.from)
  ) {
    return false;
  }

  if (
    state.dateRange?.to &&
    createdAt > endOfDay(state.dateRange.to)
  ) {
    return false;
  }

  return true;
}

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
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const activityIdsRef = useRef<Set<string>>(new Set());
  const realtimeSequenceRef = useRef(0);

  // resolve many response from many socket event and cache event to merge
  const realtimeActivitiesRef = useRef<
    Map<string, CachedRealtimeActivity>
  >(new Map());

  const selectedActionCodes = useMemo<ActivityActionCode[]>(() => {
    return actionCategories
      .flatMap((category) => category.actions)
      .filter((action) => selectedActionIds.includes(action.id))
      .map((action) => action.code);
  }, [actionCategories, selectedActionIds]);

  const realtimeStateRef = useRef<RealtimeActivityState>({
    page: 1,
    actorIds: [],
    actionCodes: [],
    dateRange: undefined,
  });

  useEffect(() => {
    realtimeStateRef.current = {
      page,
      actorIds: selectedActorIds,
      actionCodes: selectedActionCodes,
      dateRange,
    };
  }, [
    page,
    selectedActorIds,
    selectedActionCodes,
    dateRange,
  ]);

  useEffect(() => {
    activityIdsRef.current = new Set(
      activities.map((activity) => activity.id)
    );
  }, [activities]);

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
    setActivities([]);
    setPagination(initialPagination);
    activityIdsRef.current.clear();
    realtimeSequenceRef.current = 0;
    realtimeActivitiesRef.current.clear();
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
        setActors((currentActors) => {
          const actorMap = new Map(
            actorRes.data.map((actor) => [actor.id, actor])
          );

          currentActors.forEach((actor) => {
            if (!actorMap.has(actor.id)) {
              actorMap.set(actor.id, actor);
            }
          });

          return Array.from(actorMap.values()).sort(
            (first, second) =>
              first.fullName.localeCompare(second.fullName)
          );
        });
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
    const requestStartSequence = realtimeSequenceRef.current;

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
        const requestState: RealtimeActivityState = {
          page,
          actorIds: selectedActorIds,
          actionCodes: selectedActionCodes,
          dateRange,
        };
        const responseIds = new Set(
          response.data.items.map((activity) => activity.id)
        );
        const matchingRealtimeActivities = Array.from(
          realtimeActivitiesRef.current.values()
        )
          .filter(
            ({ sequence }) => sequence > requestStartSequence
          )
          .map(({ activity }) => activity)
          .filter((activity) =>
            matchesCurrentFilters(activity, requestState)
          );
        const missingRealtimeCount = matchingRealtimeActivities.filter(
          (activity) => !responseIds.has(activity.id)
        ).length;

        if (page === 1) {
          const mergedActivities = [
            ...matchingRealtimeActivities,
            ...response.data.items,
          ]
            .filter(
              (activity, index, items) =>
                items.findIndex((item) => item.id === activity.id) === index
            )
            .sort(
              (first, second) =>
                new Date(second.createdAt).getTime() -
                new Date(first.createdAt).getTime()
            )
            .slice(0, PAGE_SIZE);

          setActivities(mergedActivities);
        } else {
          setActivities(response.data.items);
        }

        setPagination(
          buildPagination(
            response.data.pagination,
            missingRealtimeCount
          )
        );
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
    selectedActionCodes,
    dateRange,
    page,
    activityRefreshKey,
  ]);


  // Socket for activity log
  useEffect(() => {
    if (!workspaceId) return;

    const socket = createActivitySocket();

    const joinWorkspace = () => {
      socket.emit(
        "workspace:join",
        { workspaceId },
        (response) => {
          if (!response.success) {
            console.error(
              "Failed to join workspace socket room:",
              response.error
            );
          }
        }
      );
    };

    const handleActivityCreated = (activity: IActivityLogItem) => {
      if (activity.workspaceId !== workspaceId) {
        return;
      }
      
      // reload actors list
      setActors((currentActors) => {
        if (
          currentActors.some(
            (actor) => actor.id === activity.actorId
          )
        ) {
          return currentActors;
        }

        return [
          ...currentActors,
          {
            id: activity.actorId,
            fullName: activity.actorName,
            email: activity.actorEmail ?? "",
          },
        ].sort((first, second) =>
          first.fullName.localeCompare(second.fullName)
        );
      });

      // avoid duplicate
      if (
        activityIdsRef.current.has(activity.id) ||
        realtimeActivitiesRef.current.has(activity.id)
      ) {
        return;
      }
      
      // ref to avoid receive old response from sooner event
      const sequence = ++realtimeSequenceRef.current;

      realtimeActivitiesRef.current.set(activity.id, {
        activity,
        sequence,
      });

      if (
        realtimeActivitiesRef.current.size >
        MAX_REALTIME_CACHE_SIZE
      ) {
        const oldestActivityId =
          realtimeActivitiesRef.current.keys().next().value;

        if (oldestActivityId) {
          realtimeActivitiesRef.current.delete(oldestActivityId);
        }
      }

      const currentState = realtimeStateRef.current;

      if (!matchesCurrentFilters(activity, currentState)) {
        return;
      }

      activityIdsRef.current.add(activity.id);

      setPagination((currentPagination) =>
        buildPagination(currentPagination, 1)
      );

      // if current page is 1, reload activities
      if (currentState.page === 1) {
        setActivities((currentActivities) =>
          [
            activity,
            ...currentActivities.filter(
              (item) => item.id !== activity.id
            ),
          ].slice(0, PAGE_SIZE)
        );
      } else {
        // refetch to change pagination info
        setActivityRefreshKey((currentKey) => currentKey + 1);
      }
    };

    const handleConnectError = (error: Error) => {
      console.error("Activity socket connection error:", error);
    };

    // Event connect cũng chạy lại sau khi Socket.IO reconnect,
    // vì vậy client sẽ tự join lại workspace room.
    socket.on("connect", joinWorkspace);
    socket.on("connect_error", handleConnectError);
    socket.on(
      "activity_log:created",
      handleActivityCreated
    );

    socket.connect();

    return () => {
      socket.off("connect", joinWorkspace);
      socket.off("connect_error", handleConnectError);
      socket.off(
        "activity_log:created",
        handleActivityCreated
      );

      if (!socket.connected) {
        socket.disconnect();
        return;
      }

      const disconnectTimer = window.setTimeout(() => {
        socket.disconnect();
      }, 500);

      socket.emit(
        "workspace:leave",
        { workspaceId },
        (response) => {
          window.clearTimeout(disconnectTimer);

          if (!response.success) {
            console.error(
              "Failed to leave workspace socket room:",
              response.error
            );
          }

          socket.disconnect();
        }
      );
    };
  }, [workspaceId]);

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
