import { useState, useEffect, type KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { workspaceApi, type WorkspaceItem, type IMemberCandidateItem, type IWorkspaceRolesResponse } from "@/api/api";
import { toast } from "sonner";
import { X, ChevronDown, Loader2 } from "lucide-react";
import avatarIcon from "@/assets/images/avatar.png";
import axios from "axios";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceItem | null;
}

export function InviteMemberModal({ isOpen, onClose, workspace }: InviteMemberModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [roleId, setRoleId] = useState<string>("");
  const [roles, setRoles] = useState<IWorkspaceRolesResponse>([]);
  const selectedRole = roles.find(
    (role) => role._id === roleId
  );
  
  const [searchResults, setSearchResults] = useState<IMemberCandidateItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce and Abort logic
  useEffect(() => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timerId = setTimeout(() => {
      workspaceApi.searchCandidate(workspace?._id, keyword, { signal: controller.signal })
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
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(timerId);
      controller.abort(); // Hủy request API cũ
    };
  }, [keyword]);

  useEffect(() => {
    const fetchWorkspaceRoles = async () => {
      try {
        const res = await workspaceApi.getRoles();
        setRoles(res.data);
      } catch (error) {
        console.log("Fail to fetch roles", error);
      }
    }

    fetchWorkspaceRoles();
  }, [])

  // Reset data khi đóng/mở modal
  useEffect(() => {
    if (isOpen) {
      setKeyword("");
      setSelectedEmails([]);
      setRoleId("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const addEmail = (email: string) => {
    const trimmed = email.trim();
    if (trimmed && !selectedEmails.includes(trimmed)) {
      setSelectedEmails([...selectedEmails, trimmed]);
    }
    setKeyword("");
    setSearchResults([]);
  };

  const removeEmail = (emailToRemove: string) => {
    setSelectedEmails(selectedEmails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) {
      e.preventDefault();
      addEmail(keyword);
    } else if (e.key === "Backspace" && !keyword && selectedEmails.length > 0) {
      removeEmail(selectedEmails[selectedEmails.length - 1]);
    }
  };

  const handleSubmit = async () => {
    if (selectedEmails.length === 0 || !workspace) return;
    setIsSubmitting(true);
    
    try {
      await Promise.all(
        selectedEmails.map((email) => 
          workspaceApi.inviteMember(workspace._id, { email, roleId: roleId })
        )
      );
      toast.success("Invitation sent successfully", {
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
      onClose();
    } catch (error) {
      toast.error("Failed to send invitations.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!workspace) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25 h-94 p-0 gap-0 flex flex-col overflow-visible bg-background border border-border rounded-[14px]">
        
        <DialogHeader className="px-6 py-4 pb-2 border-none">
          <DialogTitle className="text-[18px] font-semibold text-foreground">
            Invite member
          </DialogTitle>
        </DialogHeader>

        {/* Workspace Info Card */}
        <div className="mx-6 p-3 rounded-lg border border-border flex items-center gap-3 bg-card shadow-sm shrink-0">
          <img src={avatarIcon} alt="Avatar" className="w-10 h-10 rounded-full shrink-0 object-cover" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground truncate">
              {workspace.workspaceName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {workspace.workspaceDescription || "No description provided."}
            </span>
          </div>
        </div>

        <div className="flex flex-col px-6 pt-4 gap-4 flex-1">
          {/* Email Search Area */}
          <div className="flex flex-col gap-1.5 relative z-10">
            <label className="text-xs font-semibold text-foreground">Email addresses</label>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 border border-border rounded-lg focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-all min-h-10 bg-background">
              
              {selectedEmails.map((email) => (
                <span 
                  key={email} 
                  className="inline-flex items-center justify-center px-2 py-0.5 gap-1 bg-[#F5F5F5] rounded-full text-[13px] text-foreground font-medium"
                >
                  {email} 
                  <X 
                    size={14} 
                    className="cursor-pointer text-muted-foreground hover:text-red-500 transition-colors" 
                    onClick={() => removeEmail(email)}
                  />
                </span>
              ))}
              
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedEmails.length === 0 ? "e.g. abc@lumin.com" : ""}
                className="flex-1 min-w-30 bg-transparent outline-none text-[13px] px-1 placeholder:text-muted-foreground h-7"
              />
            </div>

            {/* Loading Indicator */}
            {isSearching && keyword && (
              <div className="absolute top-[calc(100%+4px)] right-2 z-50">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Dropdown Results */}
            {keyword.trim() !== "" && !isSearching && searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-95.25 max-h-62 overflow-y-auto bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 p-1 flex flex-col gap-1">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 hover:bg-secondary cursor-pointer rounded-lg transition-colors ${
                    user.isJoined 
                        ? "cursor-default" 
                        : "hover:bg-secondary cursor-pointer"
                    }`}
                    onClick={() => {
                        if (!user.isJoined) addEmail(user.email);
                    }}
                  >
                    <img src={avatarIcon} className="w-8 h-8 rounded-full" alt="User Avatar" />
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold truncate ${user.isJoined ? "text-muted-foreground" : "text-foreground"}`}>
                                {user.fullName}
                            </span>
                            
                            {user.isJoined && (
                                <span className="bg-gray-100 text-muted-foreground text-[11px] px-2 py-0.5 rounded-full font-medium">
                                    Joined
                                </span>
                            )}
                        </div>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dropdown Not Found / Unregistered */}
            {keyword.trim() !== "" && !isSearching && searchResults.length === 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-95.25 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 p-1">
                <div
                    className="flex items-center gap-3 p-2 hover:bg-secondary cursor-pointer rounded-lg transition-colors"
                    onClick={() => addEmail(keyword)}
                  >
                    <img src={avatarIcon} className="w-8 h-8 rounded-full" alt="User Avatar" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-[#DC2626] leading-4">Unregistered user</span>
                      <span className="text-xs text-muted-foreground truncate">{keyword}</span>
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1.5 relative z-0">
            <label className="text-xs font-semibold text-foreground">Role</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 h-10 border border-border rounded-lg text-sm bg-background hover:bg-secondary transition-colors outline-none font-medium">
                {selectedRole?.name ?? roles[0].name} <ChevronDown size={16} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-94.25 p-1 rounded-xl shadow-lg">
                {roles.map((role) => (
                  <DropdownMenuItem className="p-2.5 cursor-pointer rounded-lg hover:bg-secondary" onClick={() => setRoleId(role._id)}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{role.name}</span>
                      <span className="text-xs text-muted-foreground">{role.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div> 
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto px-6 py-5 border-t border-border bg-gray-50/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 rounded-b-[14px]">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onClose()}
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            
            <Button
                className="text-sm font-normal" 
                type="submit"
                disabled={isSubmitting || selectedEmails.length === 0}
                onClick={handleSubmit}
            >
                {isSubmitting ? "Inviting..." : "Invite"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}