import axiosInstance from "./axiosInstance";

export interface ApiResponse<T = any> {
    statusCode: number;
    data: T;
    status: string;
}

export class RegisterInput {
    email!: string;
    password!: string;
    fullName!: string;
}

export class LoginInput {
    email!: string;
    password!: string;
}

export interface IMemberCandidateItem {
    id: string;
    email: string;
    fullName: string;
    inWorkspace?: boolean;
    inDocument?: boolean;
}

export type IMemberCandidatesResponse = IMemberCandidateItem[];

export interface SearchCandidateParams{
  keyword: string,
  workspaceId?: string,
  documentId?: string
}

export const authApi = {
    login: (data: LoginInput): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/login', data);
    },

    register: (data: RegisterInput): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/register', data);
    },

    getInfo: (): Promise<ApiResponse<any>> => {
        return axiosInstance.get('/auth/user-info');
    },

    refreshToken: (): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/refresh-token');
    },

    verifyEmail: (token: string): Promise<ApiResponse<any>> => {
        return axiosInstance.get('/auth/verify-email', {
            params: {
                token: token
            }
        });
    },
    
    logout: (): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/logout');
    },

    searchCandidates: (
    params: SearchCandidateParams, 
    config?: import('axios').AxiosRequestConfig
  ): Promise<ApiResponse<IMemberCandidatesResponse>> => {
    return axiosInstance.get('/auth/search-candidates', { params, ...config });
  }
}

export interface CreateWorkspaceInput {
    name: string;
    description?: string;
}

export interface UpdateWorkspaceInput {
    name?: string;
    description?: string;
}

export interface InviteMemberInput {
    email: string;
    roleId: string;
}

export interface WorkspaceCreated {
    _id: string;
}

// --- KẾT QUẢ CỦA GET /workspace (Hàm findAll aggregation) ---
export interface WorkspaceItem {
    _id: string;
    workspaceName: string;
    workspaceDescription: string | null;
    createdAt: string; // ISO Date string
    userRole: string;  // Ví dụ: 'Admin Workspace', 'Member Workspace'
    memberCount: number;
    joinedAt: string;  // ISO Date string
}

// --- KẾT QUẢ CỦA PATCH /workspace/:id (Document Workspace đầy đủ) ---
export interface WorkspaceDetail {
    _id: string;
    name: string;
    description: string | null;
    memberCount: number;
    isDeleted: boolean;
    deletedAt: string | null;
    deletedBy: string | null;
    created_at: string; // ISO Date string
    updated_at: string; // ISO Date string
}

// --- KẾT QUẢ CHUNG CHO CÁC API TRẢ VỀ MESSAGE ---
export interface SuccessMessageResponse {
    message: string;
}

export interface IDocumentItem {
  _id: string;
  workspaceId: string;
  title: string;
  createdBy: string;
  updatedBy: string | null;
  created_at: string;
  updated_at: string;
}

export interface IWorkspaceDetailResponse {
  _id: string;
  name: string;
  description: string | null;
  memberCount: number;
  userRole: string;
  created_at: string;
  documents: IDocumentItem[];
}

export interface IWorkspaceRole {
  _id: string;
  name: string;
  description: string;
}

// Kiểu dữ liệu của mảng trả về (dùng khi call API)
export type IWorkspaceRolesResponse = IWorkspaceRole[];

export interface IWorkspaceMemberItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  roleId: string;
  joinedAt: string;
}

// Kiểu trả về khi gọi: GET /workspaces/:workspaceId/members
export type IWorkspaceMembersResponse = IWorkspaceMemberItem[];

export interface IChangeRolePayload {
  userId: string;
  roleId: string;
}

export interface IChangeRoleResponse {
  message: string;
}

export const workspaceApi = {
    /**
     * Lấy danh sách tất cả workspace mà user hiện tại là thành viên
     */
    getAll: (): Promise<ApiResponse<WorkspaceItem[]>> => {
        return axiosInstance.get('/workspace');
    },

    /**
     * Tạo một workspace mới
     */
    create: (data: CreateWorkspaceInput): Promise<ApiResponse<WorkspaceCreated>> => {
        return axiosInstance.post('/workspace', data);
    },

    /**
     * Cập nhật thông tin workspace (Tên, mô tả)
     */
    update: (workspaceId: string, data: UpdateWorkspaceInput): Promise<ApiResponse<WorkspaceDetail>> => {
        return axiosInstance.patch(`/workspace/${workspaceId}`, data);
    },

    /**
     * Xóa mềm một workspace (yêu cầu quyền DELETE/WORKSPACE)
     */
    delete: (workspaceId: string): Promise<ApiResponse<SuccessMessageResponse>> => {
        return axiosInstance.delete(`/workspace/${workspaceId}`);
    },

    /**
     * Mời một thành viên mới vào workspace thông qua email (yêu cầu quyền INVITE/MEMBER)
     */
    inviteMember: (workspaceId: string, data: InviteMemberInput): Promise<ApiResponse<SuccessMessageResponse>> => {
        return axiosInstance.post(`/workspace/${workspaceId}/invite`, data);
    },

    getById: (workspaceId: string): Promise<ApiResponse<IWorkspaceDetailResponse>> => {
        return axiosInstance.get(`/workspace/${workspaceId}`);
    },

    getRoles: (): Promise<ApiResponse<IWorkspaceRolesResponse>> => {
        return axiosInstance.get(`/workspace/roles`)
    },

    getMembers: (workspaceId: string): Promise<ApiResponse<IWorkspaceMembersResponse>> => {
        return axiosInstance.get(`/workspace/${workspaceId}/members`);
    },

    changeMemberRole: (workspaceId: string, data: IChangeRolePayload): Promise<ApiResponse<IChangeRoleResponse>> => {
        return axiosInstance.post(`/workspace/${workspaceId}/change-role`, data);
    },

    deleteMember: (workspaceId: string, userId: string): Promise<ApiResponse<string>> => {
        return axiosInstance.delete(`/workspace/${workspaceId}/members/${userId}`);
    }
};

// --- TYPES / INTERFACES CHO DOCUMENT ---

export interface CreateDocumentInput {
  workspaceId: string;
  title: string;
}

export interface UpdateDocumentInput {
  title: string;
}

// Kết quả của GET /document?workspaceId=...
export interface DocumentListItem {
  id: string;
  title: string;
  ownerName: string;
  ownerId: string;
  updatedAt: string; 
}

// Kết quả trả về sau khi tạo mới hoặc cập nhật (DocumentModel đầy đủ)
export interface DocumentDetail {
  _id: string;
  workspaceId: string;
  title: string;
  public_id: string;
  createdBy: string;
  updatedBy: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  created_at: string;
  updated_at: string;
}

export interface IUploadSignatureResponse {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
  context: string;
  notification_url: string;
}

export type DocumentRole = 'Owner' | 'Editor' | 'Commenter' | 'Viewer' | null;

export interface MyDocumentRoleResponse {
  role: DocumentRole;
}

export interface CreateDocumentMarkdownInput {
  workspaceId: string;
  title: string;
  markdownContent: string;
}

export interface IDocumentDetailResponse {
  _id: string;
  workspaceId: string;
  title: string;
  public_id: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentRole {
  _id: string;
  name: string;
  description: string;
}

export interface IExternalDocumentMemberItem {
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
}

// Kiểu trả về khi gọi GET /document/:documentId/external-members
export type IExternalDocumentMembersResponse = IExternalDocumentMemberItem[];

export interface IChangeDocumentRolePayload {
  userId: string;
  roleId: string;
}

// --- DOCUMENT API ---

export const documentApi = {
  /**
   * Lấy danh sách documents thuộc về một workspaceId
   * Backend sẽ trả về mảng các đối tượng chứa: id, title, ownerName, updatedAt
   */
  getAll: (workspaceId: string): Promise<ApiResponse<DocumentListItem[]>> => {
    return axiosInstance.get('/document', {
      params: { workspaceId },
    });
  },

  /**
   * Tạo một tài liệu mới (lưu metadata vào DB trước)
   * Người tạo sẽ tự động được gán quyền Owner
   */
  create: (data: CreateDocumentInput): Promise<ApiResponse<DocumentDetail>> => {
    return axiosInstance.post('/document', data);
  },

  /**
   * Lấy thông số chữ ký từ Backend
   */
  getUploadSignature: (documentId: string): Promise<ApiResponse<IUploadSignatureResponse>> => {
    return axiosInstance.get(`/document/${documentId}/upload-signature`);
  },

  /**
   * Đổi tên tài liệu
   */
  update: (documentId: string, data: UpdateDocumentInput): Promise<ApiResponse<DocumentDetail>> => {
    return axiosInstance.patch(`/document/${documentId}`, data);
  },

  /**
   * Xóa mềm tài liệu
   */
  delete: (documentId: string): Promise<ApiResponse<SuccessMessageResponse>> => {
    return axiosInstance.delete(`/document/${documentId}`);
  },

  /**
   * Lấy vai trò của user hiện hành đối với một tài liệu
   * Kết quả trả về chứa: { role: 'Owner' | 'Editor' | 'Viewer' | 'Commenter' }
   */
  getMyRole: (documentId: string): Promise<ApiResponse<MyDocumentRoleResponse>> => {
    return axiosInstance.get(`/document/${documentId}/my-role`);
  },

  /**
   * Tạo một tài liệu PDF mới từ nội dung Markdown
   * Backend sẽ tự render PDF và đẩy lên mây, trả về document chi tiết
   */
  createFromMarkdown: (data: CreateDocumentMarkdownInput): Promise<ApiResponse<DocumentDetail>> => {
    return axiosInstance.post('/document/from-markdown', data);
  },

  /**
   * Lấy thông tin chi tiết của một tài liệu theo ID
   * Yêu cầu quyền VIEW trên DOCUMENT
   */
  getById: (documentId: string): Promise<ApiResponse<IDocumentDetailResponse>> => {
    return axiosInstance.get(`/document/${documentId}`);
  },

  /**
   * Lấy danh sách Roles của Document
   */
  getRoles: (): Promise<ApiResponse<IDocumentRole[]>> => { // Đã sửa lại thành IDocumentRole[] cho đúng mảng trả về
    return axiosInstance.get(`/document/roles`)
  },

  /**
   * Mời một thành viên mới vào Document thông qua email
   */
  inviteMember: (documentId: string, data: InviteMemberInput): Promise<ApiResponse<SuccessMessageResponse>> => {
      return axiosInstance.post(`/document/${documentId}/invite`, data);
  },

  /**
   * Lấy danh sách các thành viên của document (nhưng không phải là thành viên của Workspace chứa nó)
   */
  getExternalMembers: (documentId: string): Promise<ApiResponse<IExternalDocumentMembersResponse>> => {
    return axiosInstance.get(`/document/${documentId}/external-members`);
  },

  /**
   * Thay đổi vai trò của người dùng đối với một document cụ thể
   */
  changeMemberRole: (documentId: string, data: IChangeDocumentRolePayload): Promise<ApiResponse<SuccessMessageResponse>> => {
    return axiosInstance.patch(`/document/${documentId}/change-role`, data);
  },
  /**
   * Xóa liên kết của người dùng với document 
   */
  deleteMemberRole: (documentId: string, userId: string): Promise<ApiResponse<string>> => {
    return axiosInstance.delete(`/document/${documentId}/external-members/${userId}`);
  }
};

// --- TYPES / INTERFACES CHO COMMENT ---

export interface CreateCommentReplyInput {
  text: string;
}

export type UpdateCommentReplyInput = Partial<CreateCommentReplyInput>;

export interface ICommentReplyResponse {
  _id: string;
  commentId: string;
  text: string;
  owner: ICommentCreator;
  isDeleted: boolean;
  deletedAt: string | null;
  created_at: string;
  updated_at: string;
  isUpdated: boolean;
}

export interface CreateDocumentAnnotationInput {
  annotationId: string;
  type: string;
  pageNumber: number;
  quads?: Record<string, any>[];
  rect?: Record<string, any>;
  contents?: string;
  color?: string;
  opacity?: number;
  xfdf?: string;
}

export interface CreateDocumentCommentInput {
  documentId: string;
  text: string;
  selectedText?: string;
  pageNumber: number;
  status?: 'OPEN' | 'RESOLVED';
  annotationRef?: string;
  annotationId?: string;
  annotation?: CreateDocumentAnnotationInput;
}

export type UpdateDocumentAnnotationInput = Partial<CreateDocumentAnnotationInput>;

export interface UpdateDocumentCommentInput {
  text?: string;
  selectedText?: string;
  pageNumber?: number;
  status?: 'OPEN' | 'RESOLVED';
  annotationRef?: string;
  annotationId?: string;
  annotation?: UpdateDocumentAnnotationInput;
}

export interface IDocumentAnnotationResponse {
  _id: string;
  documentId: string;
  annotationId: string;
  type: string;
  pageNumber: number;
  quads: Record<string, any>[];
  rect: Record<string, any> | null;
  contents: string;
  color: string;
  opacity: number;
  xfdf: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface ICommentCreator {
  id: string;
  fullName: string;
}

export interface IDocumentCommentResponse {
  _id: string;
  documentId: string;
  text: string;
  selectedText: string | null;
  pageNumber: number;
  status: 'OPEN' | 'RESOLVED';
  annotationRef: IDocumentAnnotationResponse | string | null; 
  annotationId: string | null;
  replyCount: Number;
  owner: ICommentCreator;
  created_at: string;
  updated_at: string;
  isUpdated: boolean;
}

// --- COMMENT API ---

export const commentApi = {
  /**
   * Lấy danh sách comment của một tài liệu
   */
  getByDocumentId: (documentId: string): Promise<ApiResponse<IDocumentCommentResponse[]>> => {
    return axiosInstance.get(`/comment/${documentId}`);
  },

  /**
   * Tạo một comment mới (và annotation đi kèm nếu có)
   */
  create: (data: CreateDocumentCommentInput): Promise<ApiResponse<IDocumentCommentResponse>> => {
    return axiosInstance.post('/comment', data);
  },

  /**
   * Cập nhật một comment (và annotation đi kèm nếu có)
   */
  update: (commentId: string, data: UpdateDocumentCommentInput): Promise<ApiResponse<IDocumentCommentResponse>> => {
    return axiosInstance.patch(`/comment/${commentId}`, data);
  },

  /**
   * Xóa mềm một comment
   */
  delete: (commentId: string): Promise<ApiResponse<SuccessMessageResponse>> => {
    return axiosInstance.delete(`/comment/${commentId}`);
  },

  /**
   * Tạo một reply phản hồi cho comment gốc
   */
  createReply: (commentId: string, data: CreateCommentReplyInput): Promise<ApiResponse<ICommentReplyResponse>> => {
    return axiosInstance.post(`/comment/${commentId}/reply`, data);
  },

  /**
   * Lấy danh sách các bài replies của một comment gốc
   */
  updateReply: (commentId: string, replyId: string, data: UpdateCommentReplyInput): Promise<ApiResponse<ICommentReplyResponse>> => {
    return axiosInstance.patch(`/comment/${commentId}/reply/${replyId}`, data);
  },

  deleteReply: (commentId: string, replyId: string): Promise<ApiResponse<SuccessMessageResponse>> => {
    return axiosInstance.delete(`/comment/${commentId}/reply/${replyId}`);
  },

  getReplies: (commentId: string): Promise<ApiResponse<ICommentReplyResponse[]>> => {
    return axiosInstance.get(`/comment/${commentId}/replies`);
  }
};


// --- TYPES / INTERFACES CHO SEARCH ---

export interface SearchDocumentQuery {
  search?: string;
  workspaceIds?: string[] | string;
  updatedFrom?: string | Date;
  updatedTo?: string | Date;
  page?: number;
  pageSize?: number;
}

export interface ISearchDocumentItem {
  id: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  public_id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  contentPreview: string;
  updatedAt: string;
  createdAt: string;
}

export interface ISearchPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ISearchDocumentResponse {
  items: ISearchDocumentItem[];
  pagination: ISearchPagination;
}

const formatSearchDate = (value?: string | Date) => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

const buildSearchDocumentParams = (query?: SearchDocumentQuery) => {
  if (!query) return undefined;

  return {
    search: query.search,
    workspaceIds: Array.isArray(query.workspaceIds)
      ? query.workspaceIds.join(',')
      : query.workspaceIds,
    updatedFrom: formatSearchDate(query.updatedFrom),
    updatedTo: formatSearchDate(query.updatedTo),
    page: query.page,
    pageSize: query.pageSize,
  };
};

// --- SEARCH API ---

export const searchApi = {
  /**
   * Search document theo title/content, workspaceIds, updated_at range và pagination.
   */
  searchDocuments: (
    query?: SearchDocumentQuery,
    config?: import('axios').AxiosRequestConfig,
  ): Promise<ApiResponse<ISearchDocumentResponse>> => {
    const params = buildSearchDocumentParams(query);

    return axiosInstance.get('/search/document', {
      ...config,
      params: {
        ...params,
        ...config?.params,
      },
    });
  },
};

// --- ACTIVITY TYPES ---

export type ActivityActionCode =
  | 'CREATE_DOCUMENT'
  | 'UPDATE_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'SHARE_DOCUMENT'
  | 'REVOKE_ACCESS'
  | 'INVITE_USER'
  | 'REMOVE_USER'
  | 'CHANGE_USER_ROLE'
  | 'UPDATE_SETTINGS'
  | 'WORKSPACE_CREATION';

export type ActivityTargetType = 'DOCUMENT' | 'EMAIL' | 'ROLE';

export interface IActivityTarget {
  type: ActivityTargetType;
  value: string;
  entityId: string | null;
}

export interface ActivityLogQuery {
  actorIds?: string[] | string;
  actionIds?: string[] | string;
  createdFrom?: string | Date;
  createdTo?: string | Date;
  page?: number;
  pageSize?: number;
}

export interface IActivityLogItem {
  id: string;

  actorId: string;
  actorName: string;
  actorEmail?: string;

  workspaceId: string;
  workspaceName?: string;

  actionCode: ActivityActionCode;
  targets: IActivityTarget[];

  createdAt: string;
}

export type ActivityLogCreatedPayload = IActivityLogItem;

export interface IActivityLogResponse {
  items: IActivityLogItem[];
  pagination: ISearchPagination;
}

export interface IActivityActor {
  id: string;
  fullName: string;
  email: string;
}

export interface IActivityActionOption {
  id: string;
  code: ActivityActionCode;
  action: string;
}

export interface IActivityActionGroup {
  id: string;
  category: string;
  actions: IActivityActionOption[];
}

// --- ACTIVITY QUERY HELPERS ---

const formatActivityDate = (value?: string | Date) => {
  if (!value) return undefined;

  return value instanceof Date ? value.toISOString() : value;
};

const buildActivityLogParams = (query?: ActivityLogQuery) => {
  if (!query) return undefined;

  return {
    actorIds: Array.isArray(query.actorIds)
      ? query.actorIds.join(',')
      : query.actorIds,

    actionIds: Array.isArray(query.actionIds)
      ? query.actionIds.join(',')
      : query.actionIds,

    createdFrom: formatActivityDate(query.createdFrom),
    createdTo: formatActivityDate(query.createdTo),

    page: query.page,
    pageSize: query.pageSize,
  };
};

// --- ACTIVITY API ---

export const activityApi = {
  getLogsByWorkspace: (
    workspaceId: string,
    query?: ActivityLogQuery,
    config?: import('axios').AxiosRequestConfig,
  ): Promise<ApiResponse<IActivityLogResponse>> => {
    const params = buildActivityLogParams(query);

    return axiosInstance.get(`/activity/${workspaceId}`, {
      ...config,
      params: {
        ...params,
        ...config?.params,
      },
    });
  },

  getActorsByWorkspace: (
    workspaceId: string,
    config?: import('axios').AxiosRequestConfig,
  ): Promise<ApiResponse<IActivityActor[]>> => {
    return axiosInstance.get(`/activity/${workspaceId}/actors`, config);
  },

  getActions: (
    config?: import('axios').AxiosRequestConfig,
  ): Promise<ApiResponse<IActivityActionGroup[]>> => {
    return axiosInstance.get('/activity/actions', config);
  },
};
