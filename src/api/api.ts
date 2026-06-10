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

export interface IMemberCandidateItem {
  id: string;
  email: string;
  fullName: string;
  isJoined: boolean;
}

// Kiểu dữ liệu mảng trả về khi call GET /workspaces/:workspaceId/member-candidates?email=...
export type IMemberCandidatesResponse = IMemberCandidateItem[];

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
     * Lưu ý: Tham số param backend đang định nghĩa là :id
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

    searchCandidate: (workspaceId?: string, keyword?: string, config?: import('axios').AxiosRequestConfig): Promise<ApiResponse<IMemberCandidateItem[]>> => {
        return axiosInstance.get(`/workspace/${workspaceId}/member-candidates?email=${keyword}`, config);
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

export interface MyDocumentRoleResponse {
  role: string;
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
};