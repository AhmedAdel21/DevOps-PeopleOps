import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppAttendanceRecordCard,
  AppText,
} from '@/presentation/components/atoms';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import { fetchAttendanceHistory } from '@/presentation/store/slices';
import {
  selectAttendanceHistoryItems,
  selectAttendanceHistoryHasMore,
  selectAttendanceHistoryNextCursor,
  selectAttendanceHistoryFetchStatus,
} from '@/presentation/store/selectors';
import type { SerializableAttendanceRecord } from '@/presentation/store/slices/attendance.slice';

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectAttendanceHistoryItems);
  const hasMore = useAppSelector(selectAttendanceHistoryHasMore);
  const nextCursor = useAppSelector(selectAttendanceHistoryNextCursor);
  const fetchStatus = useAppSelector(selectAttendanceHistoryFetchStatus);

  const isInitialLoad = fetchStatus === 'pending' && items.length === 0;
  const isAppending = fetchStatus === 'pending' && items.length > 0;
  const isInitialError = fetchStatus === 'error' && items.length === 0;
  const isAppendError = fetchStatus === 'error' && items.length > 0;

  useEffect(() => {
    dispatch(fetchAttendanceHistory({ append: false }));
  }, [dispatch]);

  const handleEndReached = useCallback(() => {
    if (hasMore && fetchStatus !== 'pending') {
      dispatch(fetchAttendanceHistory({ append: true, before: nextCursor ?? undefined }));
    }
  }, [dispatch, hasMore, nextCursor, fetchStatus]);

  const handleRetryInitial = useCallback(() => {
    dispatch(fetchAttendanceHistory({ append: false }));
  }, [dispatch]);

  const handleRetryAppend = useCallback(() => {
    dispatch(fetchAttendanceHistory({ append: true, before: nextCursor ?? undefined }));
  }, [dispatch, nextCursor]);

  const renderItem = useCallback(
    ({ item }: { item: SerializableAttendanceRecord }) => (
      <AppAttendanceRecordCard record={item} />
    ),
    [],
  );

  const renderFooter = () => {
    if (isAppending) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    if (isAppendError) {
      return (
        <Pressable style={styles.footer} onPress={handleRetryAppend}>
          <AppAlertBanner
            variant="error"
            message={t('attendance.history.loadMoreError')}
          />
        </Pressable>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (fetchStatus !== 'loaded') return null;
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body" color={theme.colors.mutedForeground} align="center">
          {t('attendance.history.empty')}
        </AppText>
      </View>
    );
  };

  if (isInitialLoad) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isInitialError) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <Pressable onPress={handleRetryInitial}>
            <AppAlertBanner
              variant="error"
              message={t('attendance.history.loadError')}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <FlatList<SerializableAttendanceRecord>
        data={items}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ws(24),
    },
    list: {
      paddingHorizontal: ws(20),
      paddingVertical: hs(12),
      flexGrow: 1,
    },
    footer: {
      paddingVertical: hs(16),
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hs(40),
    },
  });
