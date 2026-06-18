import type {
  IActivityActionGroup,
  IActivityActor,
} from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import { UsersIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "./ui/Button";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ActivityLogFiltersProps {
  actors: IActivityActor[];
  actionCategories: IActivityActionGroup[];
  selectedActorIds: string[];
  selectedActionIds: string[];
  dateRange: DateRange | undefined;
  isLoadingOptions?: boolean;
  onActorIdsChange: (actorIds: string[]) => void;
  onActionIdsChange: (actionIds: string[]) => void;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
}

const formatDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange?.from) {
    return "Date range";
  }

  if (!dateRange.to) {
    return format(dateRange.from, "MMM d, yyyy");
  }

  return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
    dateRange.to,
    "MMM d, yyyy"
  )}`;
};

export function ActivityLogFilters({
  actors,
  actionCategories,
  selectedActorIds,
  selectedActionIds,
  dateRange,
  isLoadingOptions = false,
  onActorIdsChange,
  onActionIdsChange,
  onDateRangeChange,
}: ActivityLogFiltersProps) {
  const selectedActors = actors.filter((actor) =>
    selectedActorIds.includes(actor.id)
  );
  const actions = actionCategories.flatMap((category) => category.actions);
  const selectedActions = actions.filter((action) =>
    selectedActionIds.includes(action.id)
  );

  const toggleActor = (actorId: string) => {
    onActorIdsChange(
      selectedActorIds.includes(actorId)
        ? selectedActorIds.filter((id) => id !== actorId)
        : [...selectedActorIds, actorId]
    );
  };

  const toggleAction = (actionId: string) => {
    onActionIdsChange(
      selectedActionIds.includes(actionId)
        ? selectedActionIds.filter((id) => id !== actionId)
        : [...selectedActionIds, actionId]
    );
  };

  const actorLabel =
    selectedActors.length === 0
      ? "Filter by actor"
      : selectedActors
          .slice(0, 2)
          .map((actor) => actor.fullName)
          .join(", ");
  const hiddenActorCount = Math.max(selectedActors.length - 2, 0);

  const actionLabel =
    selectedActions.length === 0 ? "All actions" : selectedActions[0].action;
  const hiddenActionCount = Math.max(selectedActions.length - 1, 0);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-66.25 items-center justify-start gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <UsersIcon className="h-4 w-4 shrink-0" />
            <span
              className={`min-w-0 flex-1 truncate text-left ${
                selectedActors.length === 0
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {actorLabel}
            </span>
            {hiddenActorCount > 0 && (
              <span className="shrink-0 text-foreground">
                +{hiddenActorCount}
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) p-2"
        >
          {/* List of selected-actors chips */}
          {selectedActors.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1.5 border-b border-border px-1 pb-2">
              {selectedActors.map((actor) => (
                <span
                  key={actor.id}
                  className="flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-foreground"
                >
                  <span className="truncate">{actor.fullName}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${actor.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleActor(actor.id);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* List of Actors */}
          {isLoadingOptions ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              Loading actors...
            </div>
          ) : actors.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No actors found
            </div>
          ) : (
            actors.map((actor) => {
              const checked = selectedActorIds.includes(actor.id);

              return (
                <DropdownMenuItem
                  key={actor.id}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleActor(actor.id);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleActor(actor.id)}
                    onClick={(event) => event.stopPropagation()}
                    className="h-3.5 w-3.5"
                  />
                  <img
                    src={avatar}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-full"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {actor.fullName}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-27.5 items-center justify-start gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span
              className={`min-w-0 flex-1 truncate text-left ${
                selectedActions.length === 0
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {actionLabel}
            </span>
            {hiddenActionCount > 0 && (
              <span className="shrink-0 text-foreground">
                +{hiddenActionCount}
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="min-w-60 p-2">
          {isLoadingOptions ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              Loading actions...
            </div>
          ) : actionCategories.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              No actions found
            </div>
          ) : (
            actionCategories.map((category) => (
              <div key={category.id}>
                <DropdownMenuLabel>{category.category}</DropdownMenuLabel>
                {category.actions.map((action) => {
                  const checked = selectedActionIds.includes(action.id);

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onSelect={(event) => {
                        event.preventDefault();
                        toggleAction(action.id);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAction(action.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-3.5 w-3.5"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {action.action}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-33.75 justify-start py-1.5 px-2.5 gap-1.5 rounded-lg text-left text-sm font-normal text-muted-foreground"
          >
            <CalendarIcon className="h-4 w-4 " />
            <span className="min-w-0 flex-1 truncate">
              {formatDateRange(dateRange)}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
