import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '@/presentation/components/atoms';
import type {
  RequestLogCategory,
  RequestLogEntry,
} from '@/domain/entities';
import { ServiceLocator } from '@/di';
import { DiKeys } from '@/core/keys/di.key';
import type { GetRequestLogUseCase } from '@/domain/use_cases';
import { leaveLog } from '@/core/logger';

// Chronological activity timeline for a single leave/permission request.
// Self-fetches via the GetRequestLogUseCase on mount; no slice state.
// One mount per opened detail screen is fine — the conversation isn't
// hot enough to warrant global caching, and a refetch on re-mount
// guarantees fresh data when the user comes back from another screen.
//
// Phase 4f.4 — mobile parity for the unified timeline UX the web
// reviewer dialog renders. The requester sees the same chronological
// thread of submission / reviewer comments / status changes / their
// own attachments here, so the manager's "ضيف الشهادة المرضية" lands
// in front of them with full context.

export interface ApprovalProgressLabelsForLog {
  /** Section header — caller supplies via i18n. */
  readonly title?: string;
  readonly loading: string;
  readonly empty: string;
  readonly loadFailed: string;
}

export interface AppActivityTimelineProps {
  readonly kind: 'leave' | 'permission';
  readonly id: string;
  readonly labels: ApprovalProgressLabelsForLog;
  /** Bumped by the parent to force a refetch (e.g. after the user
   *  acts on the request and the server state shifts). */
  readonly reloadKey?: number;
  readonly style?: ViewStyle;
}

interface CategoryStyle {
  readonly icon: string;
  readonly fg: string;
  readonly bg: string;
}

const categoryStyle = (
  cat: RequestLogCategory,
  theme: AppTheme,
): CategoryStyle => {
  switch (cat) {
    case 'created':
      return {
        icon: '➕',
        fg: theme.colors.status.info.base,
        bg: theme.colors.status.info.light,
      };
    case 'approved':
      return {
        icon: '✓',
        fg: theme.colors.status.success.base,
        bg: theme.colors.status.success.light,
      };
    case 'rejected':
      return {
        icon: '✗',
        fg: theme.colors.status.error.base,
        bg: theme.colors.status.error.light,
      };
    case 'edited':
      return {
        icon: '✎',
        fg: theme.colors.status.warning.base,
        bg: theme.colors.status.warning.light,
      };
    case 'comment':
      return {
        icon: '💬',
        fg: theme.colors.accentHover,
        bg: theme.colors.accent + '20',
      };
    case 'attachment':
      return {
        icon: '📎',
        fg: theme.colors.primaryInk,
        bg: theme.colors.muted,
      };
    case 'closed':
      return {
        icon: '✕',
        fg: theme.colors.mutedForeground,
        bg: theme.colors.muted,
      };
    case 'other':
    default:
      return {
        icon: '•',
        fg: theme.colors.mutedForeground,
        bg: theme.colors.muted,
      };
  }
};

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} · ${hours}:${minutes}`;
};

export const AppActivityTimeline: React.FC<AppActivityTimelineProps> = ({
  kind,
  id,
  labels,
  reloadKey,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const [entries, setEntries] = useState<RequestLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      const useCase = ServiceLocator.get<GetRequestLogUseCase>(
        DiKeys.GET_REQUEST_LOG_USE_CASE,
      );
      useCase
        .execute({ kind, id })
        .then((data) => {
          if (cancelled) return;
          setEntries(data);
        })
        .catch((e) => {
          if (cancelled) return;
          leaveLog.warn('screen', 'AppActivityTimeline fetch failed', e);
          setError(labels.loadFailed);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } catch (e) {
      leaveLog.error('screen', 'AppActivityTimeline use-case lookup failed', e);
      setError(labels.loadFailed);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [kind, id, reloadKey, labels.loadFailed]);

  if (loading && entries === null) {
    return (
      <View style={[styles.container, style, styles.centeredPad]}>
        <ActivityIndicator color={theme.colors.primaryInk} />
        <AppText
          variant="small"
          color={theme.colors.mutedForeground}
          align="center"
        >
          {labels.loading}
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style, styles.centeredPad]}>
        <AppText
          variant="small"
          color={theme.colors.status.error.base}
          align="center"
        >
          {error}
        </AppText>
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <View style={[styles.container, style, styles.centeredPad]}>
        <AppText
          variant="small"
          color={theme.colors.mutedForeground}
          align="center"
        >
          {labels.empty}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {labels.title ? (
        <AppText
          variant="caption"
          weight="semibold"
          color={theme.colors.mutedForeground}
          style={styles.title}
        >
          {labels.title}
        </AppText>
      ) : null}
      {entries.map((entry, idx) => {
        const cat = categoryStyle(entry.category, theme);
        const isLast = idx === entries.length - 1;
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.iconColumn}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: cat.bg },
                ]}
              >
                <AppText
                  variant="small"
                  weight="semibold"
                  color={cat.fg}
                >
                  {cat.icon}
                </AppText>
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.body}>
              <AppText
                variant="small"
                color={theme.colors.foreground}
                style={styles.notes}
              >
                {entry.notes}
              </AppText>
              <View style={styles.metaRow}>
                {entry.actorName ? (
                  <AppText
                    variant="caption"
                    weight="semibold"
                    color={theme.colors.mutedForeground}
                  >
                    {entry.actorName}
                  </AppText>
                ) : null}
                {entry.actorName ? (
                  <AppText
                    variant="caption"
                    color={theme.colors.mutedForeground}
                  >
                    {' · '}
                  </AppText>
                ) : null}
                <AppText
                  variant="caption"
                  color={theme.colors.mutedForeground}
                >
                  {formatTimestamp(entry.createdAt)}
                </AppText>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const buildStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: ws(12),
      paddingVertical: hs(4),
    },
    title: {
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: hs(8),
    },
    centeredPad: {
      paddingVertical: hs(24),
      gap: hs(8),
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      gap: ws(10),
    },
    iconColumn: {
      width: ws(28),
      alignItems: 'center',
    },
    iconCircle: {
      width: ws(28),
      height: ws(28),
      borderRadius: ws(14),
      alignItems: 'center',
      justifyContent: 'center',
    },
    connector: {
      flex: 1,
      width: 1.5,
      marginTop: hs(2),
      marginBottom: hs(2),
    },
    body: {
      flex: 1,
      paddingBottom: hs(14),
    },
    notes: {
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: hs(2),
    },
  });
