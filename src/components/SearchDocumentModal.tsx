import { ChevronDown, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { searchApi, workspaceApi, type ISearchDocumentResponse, type WorkspaceItem } from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Checkbox } from "./ui/checkbox";
import { BuildingOfficeIcon, File } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import notfound from "@/assets/images/not-found-document.png";

const UPDATE_TIME_LABELS = {
  any: "Any Time",
  today: "Today",
  yesterday: "Yesterday",
  past7Days: "Past 7 days",
  past30Days: "Past 30 days",
  pastYear: "Past year",
} as const;


type UpdateTimeOption = keyof typeof UPDATE_TIME_LABELS;

type UpdateTimeRange = {
  updatedFrom: string;
  updatedTo: string;
};

const UPDATE_TIME_OPTIONS: Array<{
  value: UpdateTimeOption;
  label: (typeof UPDATE_TIME_LABELS)[UpdateTimeOption];
}> = [
  { value: "any", label: UPDATE_TIME_LABELS.any },
  { value: "today", label: UPDATE_TIME_LABELS.today },
  { value: "yesterday", label: UPDATE_TIME_LABELS.yesterday },
  { value: "past7Days", label: UPDATE_TIME_LABELS.past7Days },
  { value: "past30Days", label: UPDATE_TIME_LABELS.past30Days },
  { value: "pastYear", label: UPDATE_TIME_LABELS.pastYear },
];

const emptyUpdateTimeRange: UpdateTimeRange = {
  updatedFrom: "",
  updatedTo: "",
};

const startOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const subtractDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() - days);
  return nextDate;
};

const subtractYears = (date: Date, years: number) => {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() - years);
  return nextDate;
};

const toUpdateTimeRange = (updatedFrom: Date, updatedTo: Date): UpdateTimeRange => ({
  updatedFrom: updatedFrom.toISOString(),
  updatedTo: updatedTo.toISOString(),
});

const getUpdateTimeRangeRecord = (
  now = new Date()
): Record<UpdateTimeOption, UpdateTimeRange> => {
  const yesterday = subtractDays(now, 1);

  return {
    any: emptyUpdateTimeRange,
    today: toUpdateTimeRange(startOfDay(now), endOfDay(now)),
    yesterday: toUpdateTimeRange(startOfDay(yesterday), endOfDay(now)),
    past7Days: toUpdateTimeRange(subtractDays(now, 7), now),
    past30Days: toUpdateTimeRange(subtractDays(now, 30), now),
    pastYear: toUpdateTimeRange(subtractYears(now, 1), now),
  };
};

const formatUpdatedLabel = (updatedAt: string) => {
  const date = new Date(updatedAt);
  const now = new Date();

  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffDays = Math.floor(diff / 86400);

  if (diff < 60) return "Updated just now";
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `Updated ${Math.floor(diff / 3600)}h ago`;

  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays}d ago`;

  if (diffDays < 14) return "Updated last week";
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)}w ago`;

  if (diffDays < 60) return "Updated last month";
  if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)}mo ago`;

  if (diffDays < 730) return "Updated last year";
  return `Updated ${Math.floor(diffDays / 365)}y ago`;
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

function HighlightText({
  text,
  keyword,
}: {
  text: string;
  keyword: string;
}) {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, "ig");
  const parts = text.split(regex);
  const normalizedKeyword = trimmedKeyword.toLowerCase();

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === normalizedKeyword;

        if (!isMatch) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <mark
            key={`${part}-${index}`}
            className="rounded-[3px] bg-amber-500 px-0 text-foreground"
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

export function SearchDocumentsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [searchDocuments, setSearchDocuments] = useState<ISearchDocumentResponse>();
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [selectedUpdateTimeOption, setSelectedUpdateTimeOption] =
    useState<UpdateTimeOption>("any");
  const [selectedUpdateTime, setSelectedUpdateTime] = useState<UpdateTimeRange>(
    () => getUpdateTimeRangeRecord().any
  );
  const isLoadingMoreRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const workspaceRes = await workspaceApi.getAll();

      setWorkspaces(workspaceRes.data);
    }

    fetchData();
  }, []);

  // Logic Debounce & Abort tìm kiếm email
  useEffect(() => {
    const controller = new AbortController();

    const timerId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchRes = await searchApi.searchDocuments({
          page: 1,
          search: keyword,
          workspaceIds:
            selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : undefined,
          updatedFrom: selectedUpdateTime.updatedFrom || undefined,
          updatedTo: selectedUpdateTime.updatedTo || undefined,
        }, {
          signal: controller.signal,
        });

        setSearchDocuments(searchRes.data);
      } catch {
        if (!controller.signal.aborted) {
          toast.error("Search Error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timerId);

      controller.abort();
    };
  }, [keyword, selectedWorkspaceIds, selectedUpdateTime]);

  const loadMoreDocuments = async () => {
    if (
      !searchDocuments ||
      !searchDocuments.pagination.hasNextPage ||
      isSearching ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    const nextPage = searchDocuments.pagination.page + 1;

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      const searchRes = await searchApi.searchDocuments({
        page: nextPage,
        search: keyword,
        workspaceIds: selectedWorkspaceIds.length > 0 ? selectedWorkspaceIds : undefined,
        updatedFrom: selectedUpdateTime.updatedFrom || undefined,
        updatedTo: selectedUpdateTime.updatedTo || undefined,
      })
      const nextData = searchRes.data;

      setSearchDocuments((prev) => {
        if (!prev) return nextData;

        const mergedItems = [...prev.items, ...nextData.items];
        const uniqueItems = Array.from(
          new Map(mergedItems.map((item) => [item.id, item])).values()
        );

        return {
          ...nextData,
          items: uniqueItems,
        };
      });
    } catch {
      toast.error("Error: loading more")
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
    
  };

  const handleListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceToBottom < 10) {
      loadMoreDocuments();
    }
  };

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceIds((prev) =>
      prev.includes(workspaceId)
        ? prev.filter((id) => id !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  const handleUpdateTimeChange = (value: UpdateTimeOption) => {
    const rangeRecord = getUpdateTimeRangeRecord();

    setSelectedUpdateTimeOption(value);
    setSelectedUpdateTime(rangeRecord[value]);
  };

  const MAX_VISIBLE_WORKSPACES = 3;

  const selectedWorkspaces = workspaces.filter((workspace) =>
    selectedWorkspaceIds.includes(workspace._id)
  );

  const visibleWorkspaceNames = selectedWorkspaces
    .slice(0, MAX_VISIBLE_WORKSPACES)
    .map((workspace) => workspace.workspaceName)
    .join(", ");

  const remainingWorkspaceCount = Math.max(
    selectedWorkspaces.length - MAX_VISIBLE_WORKSPACES,
    0
  );

  const selectedWorkspaceLabel =
    selectedWorkspaces.length === 0
      ? "Filter by Workspace"
      : visibleWorkspaceNames;

  const searchResultItems = searchDocuments?.items ?? [];
  const hasSearchResponse = searchDocuments !== undefined;
  const numDocumentsFound =
    searchDocuments?.pagination.total ?? 0;

  const handleDocumentSelect = (documentId: string) => {
    navigate(`/document/${documentId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-150 max-w-150! overflow-hidden rounded-xl border border-[#E5E5E5] bg-white p-0 shadow-xl"
      >
        <Command shouldFilter={false} className="rounded-none border-0 bg-white
            **:data-[slot=command-input-wrapper]:bg-white
            **:data-[slot=input-group]:bg-white
              **:data-[slot=input-group]:border-none
              **:data-[slot=command-input]:bg-transparent">
          <div className="flex w-full py-1 px-2.5 items-center gap-1.5 justify-between">

            <CommandInput
              value={keyword}
              onValueChange={setKeyword}
              placeholder="Search documents..."
              className="flex-1 w-119.5 px-0 text-sm font-normal leading-normal border-0 bg-transparent! shadow-noneoutline-none focus:ring-0 focus-visible:ring-0"
            />

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Separator />

          <div className="flex gap-2 px-4 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 flex-1 gap-1.5 py-1 px-2.5 items-center rounded-lg border border-input/30 bg-white text-xs font-normal text-foreground shadow-none outline-none hover:bg-accent"
                >
                  <BuildingOfficeIcon className="w-4 h-4 text-muted-foreground" />
                  <span
                    className={`flex flex-1 text-start truncate ${
                      selectedWorkspaceIds.length === 0
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {selectedWorkspaceLabel}
                  </span>

                  {remainingWorkspaceCount > 0 && (
                    <span className="text-foreground">
                      +{remainingWorkspaceCount}
                    </span>
                  )}

                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="start"
                sideOffset={4}
                avoidCollisions={false}
                className="w-(--radix-dropdown-menu-trigger-width) rounded-lg p-4 gap-3"
              >
                {workspaces.map((workspace) => {
                  const checked = selectedWorkspaceIds.includes(workspace._id);

                  return (
                    <DropdownMenuItem
                      key={workspace._id}
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleWorkspace(workspace._id);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleWorkspace(workspace._id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-3.5 w-3.5"
                      />

                      <img
                        src={avatar}
                        alt={workspace.workspaceName}
                        className="h-6 w-6 rounded-full"
                      />

                      <span className="min-w-0 flex-1 truncate text-sm">
                        {workspace.workspaceName}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={selectedUpdateTimeOption}
              onValueChange={(value) =>
                handleUpdateTimeChange(value as UpdateTimeOption)
              }
            >
              <SelectTrigger className="h-8 w-37.5 rounded-lg text-xs">
                <SelectValue placeholder="Updated: Any Time" />
              </SelectTrigger>

              <SelectContent position="popper"
                            side="bottom"
                            align="start"
                            sideOffset={4}
                            avoidCollisions={false}
                            className="w-47.5 rounded-lg p-2 gap-3"
              >
                {UPDATE_TIME_OPTIONS.map((option) => (
                  <SelectItem className="py-1 px-1.5" key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CommandList
            onScroll={handleListScroll}
            className="max-h-78 px-2 pb-3"
          >
            {isSearching && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching documents...
              </div>
            )}

            {!isSearching && !hasSearchResponse && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading documents...
              </div>
            )}

            {!isSearching && hasSearchResponse && searchResultItems.length === 0 && (
              <div className="flex min-h-78 flex-col items-center justify-center px-6 text-center">
                <img
                  src={notfound}
                  alt="No results found"
                  className="mb-4 h-37.5 w-37.5 object-contain"
                />

                <p className="text-sm font-medium text-foreground">
                  Hmm, we couldn't find that.
                </p>

                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Try different keywords or adjust your active filters.
                </p>
              </div>
            )}

            {!isSearching && searchResultItems.length > 0 && (
              searchResultItems.map((doc) => {
                const documentMeta = [
                  doc.workspaceName,
                  formatUpdatedLabel(doc.updatedAt),
                ].filter(Boolean).join(" · ");

                return (
                <CommandItem
                  key={doc.id}
                  value={doc.id}
                  onSelect={() => handleDocumentSelect(doc.id)}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg pl-2.5 pr-2 py-2"
                >
                  <File className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1 gap-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      <HighlightText text={doc.title} keyword={keyword} />
                    </p>

                    {doc.contentPreview && (
                      <p className="truncate text-xs text-muted-foreground">
                        <HighlightText text={doc.contentPreview} keyword={keyword} />
                      </p>
                    )}

                    <p className="truncate text-xs text-muted-foreground">
                      {documentMeta}
                    </p>
                  </div>
                </CommandItem>
                );
              }))}


              {isLoadingMore && (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    Loading more documents...
                  </div>
              )}
          </CommandList>

          <Separator />

          <div className="flex h-8 items-center justify-between gap-3 px-4 text-sm text-muted-foreground">
            <span>{numDocumentsFound} results found</span>

            <div className="flex items-center justify-end gap-3 text-xs">
              <div className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 text-xs">
                ↑
              </kbd>
              <kbd className="rounded border bg-muted px-1 text-xs">
                ↓
              </kbd>
              <span>to navigate</span>
            </div>

              <div className="flex items-center gap-1 text-xs">
              <kbd className="rounded border bg-muted px-1 text-xs">
                ↵
              </kbd>
              <span>to select</span>
            </div>

              <div className="flex items-center gap-1 text-xs">
              <kbd className="rounded border bg-muted px-1 text-xs">
                Esc
              </kbd>
              <span>to close</span>
              </div>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
