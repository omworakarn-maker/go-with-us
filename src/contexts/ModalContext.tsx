import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    isCreateModalOpen: boolean;
    openCreateModal: () => void;
    closeCreateModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);

    return (
        <ModalContext.Provider value={{ isCreateModalOpen, openCreateModal, closeCreateModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
