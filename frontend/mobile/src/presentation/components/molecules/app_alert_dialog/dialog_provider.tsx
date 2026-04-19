import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { AppAlertDialog } from './app_alert_dialog';

export interface ShowDialogOptions {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm?: () => void;
    cancelLabel?: string;
    onCancel?: () => void;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    destructive?: boolean;
    dismissOnBackdrop?: boolean;
}

interface DialogContextValue {
    showDialog: (options: ShowDialogOptions) => void;
    hideDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [options, setOptions] = useState<ShowDialogOptions | null>(null);

    const showDialog = useCallback((next: ShowDialogOptions) => {
        setOptions(next);
    }, []);

    const hideDialog = useCallback(() => {
        setOptions(null);
    }, []);

    const handleConfirm = useCallback(() => {
        const cb = options?.onConfirm;
        setOptions(null);
        cb?.();
    }, [options]);

    const handleCancel = useCallback(() => {
        const cb = options?.onCancel;
        setOptions(null);
        cb?.();
    }, [options]);

    const value = useMemo(
        () => ({ showDialog, hideDialog }),
        [showDialog, hideDialog],
    );

    return (
        <DialogContext.Provider value={value}>
            {children}
            <AppAlertDialog
                visible={options !== null}
                title={options?.title ?? ''}
                message={options?.message ?? ''}
                confirmLabel={options?.confirmLabel ?? ''}
                onConfirm={handleConfirm}
                cancelLabel={options?.cancelLabel}
                onCancel={options?.cancelLabel ? handleCancel : undefined}
                icon={options?.icon}
                iconColor={options?.iconColor}
                iconBg={options?.iconBg}
                destructive={options?.destructive}
                dismissOnBackdrop={options?.dismissOnBackdrop}
            />
        </DialogContext.Provider>
    );
};

export function useDialog(): DialogContextValue {
    const ctx = useContext(DialogContext);
    if (!ctx) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return ctx;
}
