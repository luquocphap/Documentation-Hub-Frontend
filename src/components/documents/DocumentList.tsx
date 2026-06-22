import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Link, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import avatarIcon from "@/assets/images/avatar.png";
import { DeleteDocumentModal } from "./DeleteDocumentModal";
import { RenameDocumentModal } from "./RenameDocumentModal";
import type { DocumentListItem, IWorkspaceDetailResponse } from "@/api/api";
import { useNavigate, useParams } from "react-router-dom";
import { ShareDocumentModal } from "./ShareDocumentModal";

interface DocumentListProps {
  documents: DocumentListItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentListItem[]>>;
  currentUser: any;
  workspace?: IWorkspaceDetailResponse | null;
}

export function DocumentList({ documents, setDocuments, currentUser }: DocumentListProps) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const { workspaceId } = useParams();
  
  const [docToDelete, setDocToDelete] = useState<DocumentListItem | null>(null);
  const [docToRename, setDocToRename] = useState<DocumentListItem | null>(null);
  const [docToShare, setDocToShare] = useState<DocumentListItem | null>(null);

  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="w-full flex flex-col">
      {/* Table Head */}
      <div className="flex items-center py-3 border-b border-border text-sm font-medium text-foreground">
        <div className="flex-1 min-w-0">File name</div>
        <div className="w-98.25 shrink-0">Owner</div>
        <div 
          className="w-49.75 shrink-0 flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors group/sort"
          onClick={() => setSortOrder(prev => prev === "DESC" ? "ASC" : "DESC")}
        >
          Updated date 
          {sortOrder === "DESC" ? (
            <ArrowDown size={14} className="text-muted-foreground group-hover/sort:text-foreground" />
          ) : (
            <ArrowUp size={14} className="text-muted-foreground group-hover/sort:text-foreground" />
          )}
        </div>
        <div className="w-21.75 shrink-0"></div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {sortedDocuments.map((doc) => (
          <div key={doc.id} className="flex items-center py-3 border-b border-border group hover:bg-secondary/30 transition-colors">
            
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="p-2 rounded border border-border flex items-center justify-center bg-secondary shrink-0 text-muted-foreground">
                <FileText size={16} />
              </div>
              <span className="text-sm font-medium text-foreground truncate">{doc.title}</span>
            </div>

            <div className="w-98.25 shrink-0 flex items-center p-2 gap-2">
              <img src={avatarIcon} alt={doc.ownerName} className="w-5 h-5 rounded-full border border-border object-cover shrink-0 bg-background" />
              <span className="text-sm text-foreground truncate">{doc.ownerName}</span>
            </div>

            <div className="w-49.75 shrink-0 flex items-center">
              <span className="text-sm text-foreground truncate">
                {new Date(doc.updatedAt).toLocaleDateString('en-US', { 
                  month: 'long', day: 'numeric', year: 'numeric' 
                })}
              </span>
            </div>

            <div className="w-21.75 shrink-0 flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors outline-none">
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg p-1">
                  
                  <DropdownMenuItem className="p-2 cursor-pointer rounded-lg text-sm font-medium" onClick={() => navigate(`/document/${doc.id}`)}>
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Open file
                  </DropdownMenuItem>

                  {doc.ownerId === currentUser?.id && (
                    <>
                      <DropdownMenuItem 
                        className="p-2 cursor-pointer rounded-lg text-sm font-medium"
                        onClick={() => setDocToRename(doc)}
                      >
                        <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Rename
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="p-2 cursor-pointer rounded-lg text-sm font-medium"
                        onClick={() => setDocToShare(doc)}
                      >
                        <Link className="w-4 h-4 mr-2 text-muted-foreground" /> Share
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="p-2 cursor-pointer rounded-lg text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors"
                        onClick={() => setDocToDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Render Modals at the bottom */}
      <DeleteDocumentModal 
        document={docToDelete} 
        isOpen={!!docToDelete} 
        onClose={() => setDocToDelete(null)}
        onSuccess={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
      />

      <RenameDocumentModal 
        document={docToRename} 
        isOpen={!!docToRename} 
        onClose={() => setDocToRename(null)}
        onSuccess={(id, newTitle, updatedAt) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: newTitle, updatedAt } : d))}
      />

      <ShareDocumentModal
        isOpen={!!docToShare}
        onClose={() => setDocToShare(null)}
        documentId={docToShare?.id || ""}
        documentTitle={docToShare?.title || ""}
        workspaceId={workspaceId || ""}
      />
    </div>
  );
}
