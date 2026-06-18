import type {
  ActivityActionCode,
  ActivityTargetType,
  IActivityLogItem,
  IActivityTarget,
} from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BuildingOfficeIcon, FileLockIcon, FilePlusIcon, NotePencilIcon, ShareFatIcon, TrashIcon, UserMinusIcon, UserPlusIcon, UserSwitchIcon } from "@phosphor-icons/react";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

interface ActivityLogTableProps {
  activities: IActivityLogItem[];
  isLoading?: boolean;
}

function getActionIcon(actionCode: ActivityActionCode) {
  switch (actionCode) {
    case "CREATE_DOCUMENT":
      return <FilePlusIcon />
    case "UPDATE_DOCUMENT":
      return <NotePencilIcon />
    case "DELETE_DOCUMENT":
      return <TrashIcon />;
    case "SHARE_DOCUMENT":
      return <ShareFatIcon />
    case "REVOKE_ACCESS":
      return <FileLockIcon />;
    case "INVITE_USER":
      return <UserPlusIcon />
    case "REMOVE_USER":
      return <UserMinusIcon />
    case "CHANGE_USER_ROLE":
      return <UserSwitchIcon className="text-muted-foreground" />;
    case "UPDATE_SETTINGS":
      return <Settings />;
    case "WORKSPACE_CREATION":
      return <BuildingOfficeIcon className="text-muted-foreground"/>
  }
}

function getTargetValue(
  targets: IActivityTarget[],
  type: ActivityTargetType
) {
  return targets.find((target) => target.type === type)?.value;
}

function renderTarget(value?: string) {
  return <b className="font-medium">{value ?? "Unknown"}</b>;
}

function renderActivityDescription(activity: IActivityLogItem): ReactNode {
  const documentName = getTargetValue(activity.targets, "DOCUMENT");
  const email = getTargetValue(activity.targets, "EMAIL");
  const role = getTargetValue(activity.targets, "ROLE");

  switch (activity.actionCode) {
    case "CREATE_DOCUMENT":
      return <>Created document {renderTarget(documentName)}</>;
    case "UPDATE_DOCUMENT":
      return <>Updated document {renderTarget(documentName)}</>;
    case "DELETE_DOCUMENT":
      return <>Deleted document {renderTarget(documentName)}</>;
    case "SHARE_DOCUMENT":
      return (
        <>
          Shared {renderTarget(documentName)} with {renderTarget(email)}
        </>
      );
    case "REVOKE_ACCESS":
      return (
        <>
          Revoked access for {renderTarget(email)} for{" "}
          {renderTarget(documentName)}
        </>
      );
    case "INVITE_USER":
      return <>Invited {renderTarget(email)} to the <b className="font-medium">Workspace</b></>;
    case "REMOVE_USER":
      return <>Removed {renderTarget(email)} from the <b className="font-medium">Workspace</b></>;
    case "CHANGE_USER_ROLE":
      return (
        <>
          Changed {renderTarget(email)}
          {"'s role to "}
          {renderTarget(role)}
        </>
      );
    case "UPDATE_SETTINGS":
      return <>Updated <b className="font-medium">Workspace</b> settings</>;
    case "WORKSPACE_CREATION":
      return <>Created <b className="font-medium">Workspace</b></>;
  }
}

function formatActivityTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ActivityLogTable({
  activities,
  isLoading = false,
}: ActivityLogTableProps) {
  return (
    <div className="h-full w-full rounded-none border-0">
      <Table
        className="table-fixed"
        containerClassName="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <colgroup>
          <col className="w-68.75" />
          <col />
          <col className="w-61.5" />
        </colgroup>

        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white">
          <TableRow className="border-b border-[#E5E5E5] hover:bg-transparent">
            <TableHead className="h-10 text-sm font-medium text-foreground">
              Actor
            </TableHead>

            <TableHead className="h-10 text-sm font-medium text-foreground">
              Action
            </TableHead>

            <TableHead className="h-10 text-left text-sm font-medium text-foreground">
              Timestamp
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow className="h-9 border-b border-[#E5E5E5] hover:bg-transparent">
              <TableCell
                colSpan={3}
                className="p-2 text-center text-sm text-muted-foreground"
              >
                Loading activity...
              </TableCell>
            </TableRow>
          ) : activities.length === 0 ? (
            <TableRow className="h-9 border-b border-[#E5E5E5] hover:bg-transparent">
              <TableCell
                colSpan={3}
                className="p-2 text-center text-sm text-muted-foreground"
              >
                No activity found
              </TableCell>
            </TableRow>
          ) : (
            activities.map((activity) => (
              <TableRow
                key={activity.id}
                className="h-9 border-b border-[#E5E5E5] hover:bg-muted/40"
              >
                <TableCell className="p-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={avatar}
                      alt="avatar"
                      className="w-5 h-5 rounded-full"
                    />

                    <span className="text-sm font-medium text-foreground">
                      {activity.actorName}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="p-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 rounded-full bg-muted shrink-0 items-center justify-center text-foreground [&>svg]:h-3 [&>svg]:w-3">
                      {getActionIcon(activity.actionCode)}
                    </span>

                    <span className="text-sm font-normal">{renderActivityDescription(activity)}</span>
                  </div>
                </TableCell>

                <TableCell className="p-2 text-left text-sm text-foreground">
                  {formatActivityTimestamp(activity.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
