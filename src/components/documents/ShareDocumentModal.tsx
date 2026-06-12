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
} from "@/components/ui/dropdown-menu";
import { X, ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi, documentApi, type IWorkspaceDetailResponse, workspaceApi } from "@/api/api";
import { BuildingOfficeIcon } from "@phosphor-icons/react";
import avatarIcon from "@/assets/images/avatar.png";
import axios from "axios";

export type ShareRole = string;

export interface ShareAccessUser {
  id: string;
  name: string;
  email: string;
  role: ShareRole;
  avatarUrl?: string;
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
  externalAccess?: ShareAccessUser[];
  shareLink?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Dropdown chọn role — dùng chung cho ô thêm email và từng người trong danh sách */
function RoleSelect({
  value,
  onChange,
  disabled = false,
  roleOptions = [],
}: {
  value: ShareRole;
  onChange: (role: ShareRole) => void;
  disabled?: boolean;
  roleOptions?: any[];
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
      <DropdownMenuContent align="end" className="min-w-32">
        {roleOptions.map((role) => (
          <DropdownMenuItem
            key={role._id}
            onSelect={() => onChange(role.name)}
            className="justify-between"
          >
            {role.name}
            {role.name === value && <Check size={14} className="text-foreground" />}
          </DropdownMenuItem>
        ))}
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
  externalAccess = [],
  shareLink,
}: ShareDocumentModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const [newRole, setNewRole] = useState<ShareRole>("Viewer");
  const [accessList, setAccessList] = useState<ShareAccessUser[]>(externalAccess);
  const [roles, setRoles] = useState<any[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse>();

  // Đồng bộ lại danh sách khi mở modal / dữ liệu thay đổi
  useEffect(() => {
    if (isOpen) {
      setAccessList(externalAccess);
      setKeyword("");
      setSelectedEmails([]);
      setSearchResults([]);
    }
  }, [isOpen]);

  // Cập nhật lại useEffect để gọi API
  useEffect(() => {
    if (isOpen) {
      setAccessList(externalAccess);
      
      const fetchData = async () => {
        try {
          const [rolesRes, userRes, workspaceRes] = await Promise.all([
            documentApi.getRoles(),
            authApi.getInfo(),
            workspaceApi.getById(workspaceId)
          ]);
          
          // Kiểm tra và gán danh sách roles (đảm bảo luôn là mảng)
          const fetchedRoles = Array.isArray(rolesRes.data) ? rolesRes.data : [rolesRes.data];
          setRoles(fetchedRoles);
          
          if (fetchedRoles.length > 0) {
            setNewRole(fetchedRoles[1].name);
          }
          
          // Gán thông tin user gọi API thành Owner
          setOwnerInfo(userRes.data);
          setWorkspace(workspaceRes.data);
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  // Logic Debounce & Abort tìm kiếm email
  useEffect(() => {
    if (!keyword.trim() || !workspaceId) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timerId = setTimeout(() => {
      authApi.searchCandidates(
        { keyword: keyword, workspaceId: workspaceId, documentId: documentId }, 
        { signal: controller.signal }
      )
        .then((res) => {
          setSearchResults(res.data);
          console.log(searchResults);
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
  }, [keyword, workspaceId]);

  const addEmail = (emailToAdd: string) => {
    const trimmed = emailToAdd.trim();
    if (trimmed && !selectedEmails.includes(trimmed)) {
      setSelectedEmails([...selectedEmails, trimmed]);
    }
    setKeyword("");
    setSearchResults([]);
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
    console.log(finalEmails)

    // Tìm roleId từ danh sách roles dựa trên newRole (tên role hiện tại đang chọn)
    const selectedRoleObj = roles.find((r) => r.name === newRole);
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

      toast.success("Invited successfully");

      // Cập nhật AccessList trên UI
      setAccessList((prev) => [
        ...prev,
        ...finalEmails.map((emailStr) => ({
          id: `${Date.now()}-${emailStr}`,
          name: emailStr.split("@")[0],
          email: emailStr,
          role: newRole,
        }))
      ]);
      
      setSelectedEmails([]);
      setKeyword("");
      if (roles.length > 0) setNewRole(roles[0].name); 

    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to add some users. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleChangeRole = (id: string, role: ShareRole) => {
    // TODO: gọi API đổi quyền khi backend sẵn sàng
    setAccessList((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleCopyLink = async () => {
    const link = shareLink || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
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
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedEmails.length === 0 ? "Enter email address..." : ""}
                      className="flex-1 min-w-30 bg-transparent outline-none text-sm px-1 placeholder:text-muted-foreground h-7"
                    />
                  </div>

                  {/* Nút RoleSelect cố định bên phải (vẫn giữ thiết kế CSS cũ) */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <RoleSelect value={newRole} onChange={setNewRole} roleOptions={roles.filter((r) => r._id !== "111111111111111111111001")} />
                  </div>

                  {/* Icon Loading */}
                  {isSearching && keyword && (
                    <div className="absolute top-[calc(100%+4px)] right-2 z-50">
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    </div>
                  )}

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
                  primary={ownerInfo.fullName || ownerInfo.name}
                  secondary={ownerInfo.email}
                  trailing={<RoleSelect value="Owner" onChange={() => {}} disabled />}
                />
              )}

              {/* Người ngoài workspace có quyền xem — owner có thể đổi role */}
              {accessList.map((user) => (
                <AccessRow
                  key={user.id}
                  avatar={
                    <Avatar>
                      <img 
                            src={avatarIcon} 
                            alt={user.name}
                            className="rounded-full"
                         />
                    </Avatar>
                  }
                  primary={user.name}
                  secondary={user.email}
                  trailing={
                    <RoleSelect
                        value={user.role}
                        onChange={(role) => handleChangeRole(user.id, role)}
                        roleOptions={roles}
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
