import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  pick,
  keepLocalCopy,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import { Paperclip, X } from 'lucide-react-native';

import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { ServiceLocator } from '@/di/service_locator';
import { DiKeys } from '@/core/keys/di.key';
import type { AttachmentRepository, UploadedAttachment } from '@/domain/repositories';
import { leaveLog } from '@/core/logger';
import { AppText } from '../../atoms/app_text';
import { AppButton } from '../../atoms/app_button';

export interface AppAttachmentPickerProps {
  /** Controlled list of files already uploaded for the current request. */
  attachments: UploadedAttachment[];
  /** Called whenever the list changes (file added, file removed). */
  onChange: (attachments: UploadedAttachment[]) => void;
  /** Disable both the "Add" button and per-file delete buttons. */
  disabled?: boolean;
  /** Hard cap that mirrors `Attachments:MaxFilesPerRequest` on the backend. */
  maxFiles?: number;
  style?: ViewStyle;
}

/**
 * Lets a user pick image / PDF files, uploads each to `POST /api/attachments`,
 * and exposes the resulting ids via `onChange`. The parent form passes those
 * ids in `attachmentIds` when submitting the leave / permission request.
 *
 * Each file is uploaded immediately on pick; if upload fails the file isn't
 * added to the list and the user sees the error inline. Removed files are
 * best-effort deleted on the backend (the GC sweep will catch them either
 * way after 24h).
 */
export const AppAttachmentPicker: React.FC<AppAttachmentPickerProps> = ({
  attachments,
  onChange,
  disabled = false,
  maxFiles = 5,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repo = useMemo(
    () => ServiceLocator.get<AttachmentRepository>(DiKeys.ATTACHMENT_REPOSITORY),
    [],
  );

  const canAdd = !disabled && !isUploading && attachments.length < maxFiles;

  const handleAdd = useCallback(async () => {
    if (!canAdd) return;
    setError(null);

    let picked;
    try {
      // pick() always returns an array; we configured single-select so [0]
      // is the only element.
      const results = await pick({
        type: [types.images, types.pdf],
        allowMultiSelection: false,
      });
      picked = results[0];
      if (!picked) return;   // Defensive — empty array shouldn't normally happen.
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
        return;   // User dismissed — not an error.
      }
      leaveLog.warn('screen', 'document picker threw', e);
      setError('Could not open file picker.');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = picked.name ?? 'file';
      leaveLog.info(
        'screen',
        `picked file: name=${fileName}, type=${picked.type}, size=${picked.size}, uri=${picked.uri}`,
      );

      // The picker returns a content:// URI on Android. The library docs
      // claim RN's fetch can stream those directly through FormData, but
      // that path fails with "Network request failed" on some Android +
      // RN combinations once the URI's transient read permission expires.
      // keepLocalCopy stages a stable file:// URI in the app's cache.
      let uploadUri = picked.uri;
      if (Platform.OS === 'android') {
        try {
          const [copy] = await keepLocalCopy({
            files: [{ uri: picked.uri, fileName }],
            destination: 'cachesDirectory',
          });
          if (copy.status === 'success') {
            uploadUri = copy.localUri;
            leaveLog.info('screen', `keepLocalCopy success: localUri=${copy.localUri}`);
          } else {
            leaveLog.warn(
              'screen',
              'keepLocalCopy reported error; falling back to original uri',
              copy.copyError,
            );
          }
        } catch (copyErr) {
          leaveLog.warn('screen', 'keepLocalCopy threw; falling back', copyErr);
        }
      }

      leaveLog.info('screen', `uploading with final uri=${uploadUri}`);

      const uploaded = await repo.uploadAttachment({
        uri: uploadUri,
        fileName,
        contentType: picked.type ?? 'application/octet-stream',
        sizeBytes: picked.size ?? 0,
      });
      onChange([...attachments, uploaded]);
    } catch (e) {
      leaveLog.error('screen', 'uploadAttachment failed', e);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [canAdd, repo, attachments, onChange]);

  const handleRemove = useCallback(
    async (id: string) => {
      if (disabled) return;
      onChange(attachments.filter(a => a.id !== id));
      // Fire-and-forget: cleanup is non-blocking. Backend GC catches it.
      void repo.deleteStagedAttachment(id);
    },
    [disabled, attachments, onChange, repo],
  );

  return (
    <View style={[styles.container, style]}>
      {attachments.length > 0 && (
        <View style={styles.list}>
          {attachments.map(file => (
            <View key={file.id} style={styles.row}>
              <Paperclip
                size={hs(16)}
                color={theme.colors.mutedForeground}
                style={styles.rowIcon}
              />
              <View style={styles.rowText}>
                <AppText variant="body" numberOfLines={1}>
                  {file.fileName}
                </AppText>
                <AppText variant="small" color={theme.colors.mutedForeground}>
                  {formatSize(file.sizeBytes)}
                </AppText>
              </View>
              <Pressable
                onPress={() => handleRemove(file.id)}
                disabled={disabled}
                hitSlop={8}
                style={styles.removeBtn}
                accessibilityLabel={`Remove ${file.fileName}`}
              >
                <X size={hs(16)} color={theme.colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <AppButton
        label={isUploading ? 'Uploading…' : 'Add file'}
        variant="outline"
        size="sm"
        leftIcon={Paperclip}
        onPress={handleAdd}
        loading={isUploading}
        disabled={!canAdd}
      />

      {error && (
        <AppText variant="small" color={theme.colors.status.error.foreground}>
          {error}
        </AppText>
      )}

      {attachments.length >= maxFiles && (
        <AppText variant="small" color={theme.colors.mutedForeground}>
          Maximum {maxFiles} files reached.
        </AppText>
      )}
    </View>
  );
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const buildStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: hs(8),
    },
    list: {
      gap: hs(6),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hs(8),
      paddingHorizontal: ws(10),
      borderRadius: hs(8),
      backgroundColor: theme.colors.muted,
      gap: ws(8),
    },
    rowIcon: {
      flexShrink: 0,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    removeBtn: {
      padding: hs(4),
    },
  });
