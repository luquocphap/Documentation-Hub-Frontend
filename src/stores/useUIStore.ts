import { create } from 'zustand';

interface UIState {
  isCreateWorkspaceOpen: boolean;
  isSearchModalOpen: boolean;

  openCreateWorkspaceModal: () => void;
  closeCreateWorkspaceModal: () => void;
  setCreateWorkspaceModalOpen: (open: boolean) => void;

  openSearchModal: () => void;
  closeSearchModal: () => void;
  setSearchModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreateWorkspaceOpen: false,
  isSearchModalOpen: false,

  openCreateWorkspaceModal: () => set({ isCreateWorkspaceOpen: true }),
  closeCreateWorkspaceModal: () => set({ isCreateWorkspaceOpen: false }),
  setCreateWorkspaceModalOpen: (open) => set({ isCreateWorkspaceOpen: open }),

  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
}));
