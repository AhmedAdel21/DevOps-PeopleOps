import React, { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppBadge,
  type AppBadgeVariant,
  AppText,
} from '@/presentation/components/atoms';
import type {
  ApprovalLeg,
  ApprovalLegStatus,
  ApprovalProgress,
} from '@/domain/entities';

// Per-leg approval progress visualisation. Each leg (Manager / HR /
// optionally CEO) renders as a row: label + status chip. The decisive
// leg is bolded so reviewers see at a glance which level terminalizes
// the request. The CEO row is hidden when the request is HR-decisive
// (NeedCeoApprove=false) since the CEO leg is `Superseded` by design
// and rendering it would just add noise.
//
// i18n-agnostic — strings come from props so screens own the i18n
// namespace (typically `leaves.approvalProgress.*`). See
// leave_request_detail_screen for the canonical wiring.

export interface ApprovalProgressLabels {
  /** Section header (optional — caller can render its own title). */
  readonly title?: string;
  /** Per-leg labels. */
  readonly legs: {
    readonly manager: string;
    readonly hr: string;
    readonly ceo: string;
  };
  /** Status chip labels keyed by ApprovalLegStatus. */
  readonly statuses: Readonly<Record<ApprovalLegStatus, string>>;
}

export interface AppApprovalProgressProps {
  readonly progress: ApprovalProgress;
  readonly labels: ApprovalProgressLabels;
  readonly style?: ViewStyle;
}

/** ApprovalLegStatus → AppBadge variant (theme-driven status palette). */
const variantForStatus = (status: ApprovalLegStatus): AppBadgeVariant => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Pending':
      return 'warning';
    case 'Superseded':
    default:
      return 'neutral';
  }
};

interface LegRowProps {
  readonly label: string;
  readonly leg: ApprovalLeg;
  readonly statusLabel: string;
  readonly isDecisive: boolean;
  readonly theme: AppTheme;
}

const LegRow: React.FC<LegRowProps> = ({
  label,
  leg,
  statusLabel,
  isDecisive,
  theme,
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hs(8),
    }}
  >
    <AppText
      variant="label"
      weight={isDecisive ? 'semibold' : 'regular'}
      color={theme.colors.foreground}
    >
      {label}
    </AppText>
    <AppBadge variant={variantForStatus(leg.status)} label={statusLabel} />
  </View>
);

export const AppApprovalProgress: React.FC<AppApprovalProgressProps> = ({
  progress,
  labels,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const showCeo = progress.decisiveLevel === 'Ceo';

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
      <LegRow
        label={labels.legs.manager}
        leg={progress.manager}
        statusLabel={labels.statuses[progress.manager.status]}
        isDecisive={false}
        theme={theme}
      />
      <View style={styles.divider} />
      <LegRow
        label={labels.legs.hr}
        leg={progress.hr}
        statusLabel={labels.statuses[progress.hr.status]}
        isDecisive={progress.decisiveLevel === 'HrManager'}
        theme={theme}
      />
      {showCeo ? (
        <>
          <View style={styles.divider} />
          <LegRow
            label={labels.legs.ceo}
            leg={progress.ceo}
            statusLabel={labels.statuses[progress.ceo.status]}
            isDecisive={true}
            theme={theme}
          />
        </>
      ) : null}
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
      marginBottom: hs(4),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
  });
