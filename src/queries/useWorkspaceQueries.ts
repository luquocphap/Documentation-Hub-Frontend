import { useQuery } from '@tanstack/react-query';
import { workspaceApi, type IWorkspaceDetailResponse, type WorkspaceItem } from '@/api/api';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceQueryKeys.all, 'list'] as const,
  details: () => [...workspaceQueryKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...workspaceQueryKeys.details(), id] as const,
};

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery<IWorkspaceDetailResponse>({
    queryKey: workspaceQueryKeys.detail(workspaceId),
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const res = await workspaceApi.getById(workspaceId);
      return res.data;
    },
    enabled: Boolean(workspaceId),
    staleTime: 60 * 1000,
  });
}

export function useWorkspaceList() {
  return useQuery<WorkspaceItem[]>({
    queryKey: workspaceQueryKeys.lists(),
    queryFn: async () => {
      const res = await workspaceApi.getAll();
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
