import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { X, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authApi, documentApi, type IDocumentRole, type IExternalDocumentMemberItem, type IMemberCandidateItem, type IWorkspaceDetailResponse, workspaceApi } from "@/api/api";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import avatarIcon from "@/assets/images/avatar.png";
import axios from "axios";
import { APP_URL } from "@/lib/constant";

export type ShareRole = string;

interface CurrentUserInfo {
  fullName?: string;
  name?: string;
  email: string;
}

export interface ShareDocumentOwner {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  workspaceId: string;
  owner?: ShareDocumentOwner;
}

/** Dropdown chọn role — dùng chung cho ô thêm email và từng người trong danh sách */
function RoleSelect({
  value,
  onChange,
  onRemove,
  disabled = false,
  roleOptions = [],
}: {
  value: ShareRole;
  onChange: (role: IDocumentRole) => void;
  onRemove?: () => void;
  disabled?: boolean;
  roleOptions?: IDocumentRole[];
}) {
  if (disabled) {
    return (
      <span className="px-2 py-1 text-sm font-medium text-muted-foreground select-none">
        {value}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-foreground rounded-md hover:bg-muted transition-colors outline-none"
        >
          {value}
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60.5">
        {roleOptions.map((role) => (
          <DropdownMenuItem
            key={role._id}
            onSelect={() => onChange(role)}
            className="p-2.5 cursor-pointer rounded-lg hover:bg-secondary"
          >
            <div className="w-full flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{role.name}</span>
                <span className="text-xs text-muted-foreground">{role.description}</span>
            </div>
          </DropdownMenuItem>
        ))}

        {onRemove && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onSelect={onRemove}
              variant="destructive"
              className="p-2.5 cursor-pointer rounded-lg bg-red-50 text-[#DC2626] focus:bg-red-50 focus:text-[#DC2626]"
            >
              <Trash2 size={14} />
              <span className="text-sm font-medium">Remove</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Một hàng hiển thị avatar + tên/email + role */
function AccessRow({
  avatar,
  primary,
  secondary,
  trailing,
}: {
  avatar: React.ReactNode;
  primary: string;
  secondary: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="w-full flex items-center gap-3 py-2.5 px-3">
      {avatar}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{primary}</p>
        <p className="text-xs text-muted-foreground truncate">{secondary}</p>
      </div>
      <div className="shrink-0 text-foreground text-xs font-normal">{trailing}</div>
    </div>
  );
}

export function ShareDocumentModal({
  isOpen,
  onClose,
  documentTitle,
  documentId,
  workspaceId,
}: ShareDocumentModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<IMemberCandidateItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoadingAccessList, setIsLoadingAccessList] = useState(false);
  const [updatingRoleUserIds, setUpdatingRoleUserIds] = useState<string[]>([]);
  
  const [newRoleId, setNewRoleId] = useState("");
  const [accessList, setAccessList] = useState<IExternalDocumentMemberItem[]>([]);
  const [roles, setRoles] = useState<IDocumentRole[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<CurrentUserInfo | null>(null);
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse>();
  const assignableRoles = roles.filter((role) => role.name !== "Owner");
  const selectedNewRole = roles.find((role) => role._id === newRoleId);

  // Khi mở modal, tải dữ liệu share và external members trực tiếp từ API.
  useEffect(() => {
    if (!isOpen || !documentId) return;

    let shouldIgnore = false;

    const fetchData = async () => {
      setKeyword("");
      setSelectedEmails([]);
      setSearchResults([]);
      setAccessList([]);
      setUpdatingRoleUserIds([]);
      setIsLoadingAccessList(true);
      try {
        const [rolesRes, userRes, externalMembersRes, workspaceRes] = await Promise.all([
          documentApi.getRoles(),
          authApi.getInfo(),
          documentApi.getExternalMembers(documentId),
          workspaceId ? workspaceApi.getById(workspaceId) : Promise.resolve(null),
        ]);

        if (shouldIgnore) return;

        const fetchedRoles = rolesRes.data;
        const fetchedAssignableRoles = fetchedRoles.filter((role) => role.name !== "Owner");
        const defaultRole = fetchedAssignableRoles.find((role) => role.name === "Viewer")
          ?? fetchedAssignableRoles[0]
          ?? fetchedRoles[0];
        setRoles(fetchedRoles);

        setNewRoleId((currentRoleId) => {
          if (currentRoleId && fetchedAssignableRoles.some((role) => role._id === currentRoleId)) {
            return currentRoleId;
          }

          return defaultRole?._id ?? "";
        });

        setOwnerInfo(userRes.data);
        setWorkspace(workspaceRes?.data);
        setAccessList(externalMembersRes.data);
      } catch (error) {
        if (!shouldIgnore) {
          console.error("Failed to fetch share modal data:", error);
          setAccessList([]);
          toast.error("Failed to load sharing information");
        }
      } finally {
        if (!shouldIgnore) {
          setIsLoadingAccessList(false);
        }
      }
    };

    fetchData();

    return () => {
      shouldIgnore = true;
    };
  }, [isOpen, documentId, workspaceId]);

  // Logic Debounce & Abort tìm kiếm email
  useEffect(() => {
    if (!keyword.trim() || !workspaceId || !documentId) {
      return;
    }

    const controller = new AbortController();

    const timerId = setTimeout(() => {
      setIsSearching(true);
      authApi.searchCandidates(
        { keyword: keyword, workspaceId: workspaceId, documentId: documentId }, 
        { signal: controller.signal }
      )
        .then((res) => {
          setSearchResults(res.data);
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            console.error("Search error:", err);
            setSearchResults([]);
          }
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 400);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [keyword, workspaceId, documentId]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);

    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const addEmail = (emailToAdd: string) => {
    const trimmed = emailToAdd.trim();
    if (trimmed && !selectedEmails.includes(trimmed)) {
      setSelectedEmails([...selectedEmails, trimmed]);
    }
    setKeyword("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const removeEmail = (emailToRemove: string) => {
    setSelectedEmails(selectedEmails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) {
      e.preventDefault();
      addEmail(keyword);
    } else if (e.key === "Backspace" && !keyword && selectedEmails.length > 0) {
      removeEmail(selectedEmails[selectedEmails.length - 1]);
    }
  };

  const handleAdd = async () => {
    const finalEmails = [...selectedEmails];

    if (finalEmails.length === 0) return;
    // Tìm roleId từ danh sách roles dựa trên role hiện tại đang chọn
    const selectedRoleObj = roles.find((r) => r._id === newRoleId);
    if (!selectedRoleObj) {
      toast.error("Vui lòng chọn quyền hợp lệ");
      return;
    }
    setIsInviting(true);

    try {
      // Gọi API mời lần lượt từng người
      await Promise.all(
        finalEmails.map((emailStr) =>
          documentApi.inviteMember(documentId, {
            email: emailStr,
            roleId: selectedRoleObj._id, 
          })
        )
      );

      toast.success("Access updated successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });

      // Cập nhật AccessList trên UI
      const externalMembersRes = await documentApi.getExternalMembers(documentId);
      setAccessList(externalMembersRes.data);
      
      setSelectedEmails([]);
      setKeyword("");
      if (assignableRoles.length > 0) setNewRoleId(assignableRoles[0]._id); 

    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to add some users. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = async (user: IExternalDocumentMemberItem, role: IDocumentRole) => {
    if (user.roleId === role._id) return;

    const previousAccessList = accessList;
    setUpdatingRoleUserIds((prev) => [...prev, user.userId]);
    setAccessList((prev) =>
      prev.map((member) =>
        member.userId === user.userId
          ? { ...member, roleId: role._id, roleName: role.name }
          : member
      )
    );

    try {
      await documentApi.changeMemberRole(documentId, {
        userId: user.userId,
        roleId: role._id,
      });

      toast.success("Role updated successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });
    } catch (error) {
      console.error("Change role error:", error);
      setAccessList(previousAccessList);
      toast.error("Failed to update role");
    } finally {
      setUpdatingRoleUserIds((prev) => prev.filter((userId) => userId !== user.userId));
    }
  };

  const handleRemoveAccess = async (user: IExternalDocumentMemberItem) => {
    const previousAccessList = accessList;
    setUpdatingRoleUserIds((prev) => [...prev, user.userId]);

    try {
      await documentApi.deleteMemberRole(documentId, user.userId);

      setAccessList((prev) => prev.filter((member) => member.userId !== user.userId));
      toast.success("Access removed successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });
    } catch (error) {
      console.error("Remove access error:", error);
      setAccessList(previousAccessList);
      toast.error("Failed to remove access");
    } finally {
      setUpdatingRoleUserIds((prev) => prev.filter((userId) => userId !== user.userId));
    }
  };

  const handleCopyLink = async () => {
    const link = `${APP_URL}/document/${documentId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-114 w-full p-0 gap-0 bg-white border border-[#E5E5E5] rounded-[14px] flex flex-col"
      >
        {/* HEADER: h3 chiếm hết chiều rộng + nút cancel X */}
        <DialogHeader className="flex flex-row items-center justify-between gap-2 pl-6 pr-9 pt-6 pb-5">
          <DialogTitle className="flex-1 text-lg font-normal text-foreground truncate">
            Share 
            <span className="text-lg font-medium"> {documentTitle}</span>
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </DialogHeader>

        {/* CONTENT */}
        <div className="px-3 pb-6">
          <div className="pb-4">
            <div className="flex flex-col gap-1.5 pb-3 px-3">
              <Label className="text-sm font-medium text-foreground">
                Add people by email
              </Label>
              <div className="flex items-start gap-2">
                <div className="relative flex-1">
                  
                  {/* Khối Input giả chứa badges */}
                  <div className="flex flex-wrap z-50 items-center gap-1.5 p-1.5 border border-[#E5E5E5] rounded-md focus-within:ring-1 focus-within:ring-ring transition-all min-h-10 pr-24 bg-white">
                    {selectedEmails.map((emailItem) => (
                      <span 
                        key={emailItem} 
                        className="inline-flex items-center justify-center px-2 py-0.5 gap-1 bg-muted rounded-full text-[13px] text-foreground font-medium"
                      >
                        {emailItem} 
                        <X 
                          size={14} 
                          className="cursor-pointer text-muted-foreground hover:text-red-500 transition-colors" 
                          onClick={() => removeEmail(emailItem)}
                        />
                      </span>
                    ))}
                    
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleKeywordChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedEmails.length === 0 ? "Enter email address..." : ""}
                      className="flex-1 min-w-30 bg-transparent outline-none text-sm px-1 placeholder:text-muted-foreground h-7"
                    />
                  </div>

                  {/* Nút RoleSelect cố định bên phải */}
                  <div className="absolute right-1 top-5 -translate-y-1/2">
                    <RoleSelect
                      value={selectedNewRole?.name ?? "Select role"}
                      onChange={(role) => setNewRoleId(role._id)}
                      roleOptions={assignableRoles}
                    />
                  </div>

                  {/* Dropdown: Kết quả có người dùng trong hệ thống */}
                  {keyword.trim() !== "" && !isSearching && searchResults.length > 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-62 overflow-y-auto bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-[100] p-1 flex flex-col gap-1">
                      {searchResults.map((user) => {
                        // Logic kiểm tra disable
                        const isDisabled = user.inWorkspace || user.inDocument;

                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              isDisabled
                                ? "cursor-not-allowed opacity-60 bg-gray-50" 
                                : "hover:bg-muted cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isDisabled) addEmail(user.email);
                            }}
                          >
                            <Avatar className="w-8 h-8">
                              <img 
                                    src={avatarIcon} 
                                    alt={user.fullName}
                                    className="rounded-full"
                                />
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate text-foreground">
                                  {user.fullName}
                                </span>
                                {/* Badge logic hiển thị ưu tiên inWorkspace trước */}
                                {user.inWorkspace ? (
                                  <span className="bg-gray-200 text-muted-foreground text-[11px] px-2 py-0.5 rounded-full font-medium">
                                    In Workspace
                                  </span>
                                ) : user.inDocument ? (
                                  <span className="bg-gray-200 text-muted-foreground text-[11px] px-2 py-0.5 rounded-full font-medium">
                                    Has access
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown: Unregistered User */}
                  {keyword.trim() !== "" && !isSearching && searchResults.length === 0 && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 p-1">
                      <div
                        className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer rounded-lg transition-colors"
                        onClick={() => addEmail(keyword)}
                      >
                        <Avatar className="w-8 h-8">
                          <img 
                            src={avatarIcon} 
                            alt="Unregistered User"
                            className="rounded-full"
                         />
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#DC2626] leading-4">
                              Unregistered User
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{keyword}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
                
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={selectedEmails.length === 0 && !keyword.trim()}
                  className="h-10 py-2 px-2.5 text-primary-foreground font-medium shrink-0"
                >
                  {isInviting ? <Loader2 size={16} className="animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>

            {/* Danh sách người có quyền truy cập */}
            <div className="flex flex-col">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1">
                Who has access
              </p>

              {/* Mặc định: mọi thành viên trong workspace */}
              <AccessRow
                avatar={
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <BuildingOfficeIcon size={16} />
                  </span>
                }
                primary={`Everyone in ${workspace?.name}`}
                secondary={`${workspace?.memberCount} ${workspace?.memberCount === 1 ? "person" : "people"}`}
                trailing={<RoleSelect value={"Viewer"} onChange={() => {}} disabled />}
              />

              {/* Owner: không đổi quyền được */}
              {ownerInfo && (
                <AccessRow
                  avatar={
                    <Avatar>
                        <img 
                            src={avatarIcon} 
                            alt={ownerInfo.name}
                            className="rounded-full"
                         />
                    </Avatar>
                  }
                  primary={ownerInfo.fullName || ownerInfo.name || ownerInfo.email}
                  secondary={ownerInfo.email}
                  trailing={<RoleSelect value="Owner" onChange={() => {}} disabled />}
                />
              )}

              {/* Người ngoài workspace có quyền xem — owner có thể đổi role */}
              {isLoadingAccessList && (
                <div className="w-full flex items-center gap-2 py-2.5 px-3 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Loading shared members...
                </div>
              )}

              {!isLoadingAccessList && accessList.map((user) => (
                <AccessRow
                  key={user.userId}
                  avatar={
                    <Avatar>
                      <img 
                            src={avatarIcon} 
                            alt={user.fullName}
                            className="rounded-full"
                         />
                    </Avatar>
                  }
                  primary={user.fullName}
                  secondary={user.email}
                  trailing={
                    <RoleSelect
                        value={user.roleName}
                        onChange={(role) => handleChangeRole(user, role)}
                        onRemove={() => handleRemoveAccess(user)}
                        disabled={updatingRoleUserIds.includes(user.userId)}
                        roleOptions={assignableRoles}
                    />
                  }
                />
              ))}
            </div>
          </div>

          {/* Share link */}
          <div className="flex items-center justify-between gap-4 pt-4 px-3 border-t border-[#E5E5E5]">
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-medium text-foreground">Share link</h3>
              <p className="text-sm text-muted-foreground truncate">
                Only people with access can open this link.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0 bg-white"
            >
              Copy link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
