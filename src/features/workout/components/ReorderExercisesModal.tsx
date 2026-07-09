import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ChevronLeftIcon, DragHandleIcon, MinusIcon } from '@/components/icons/ActionIcons';
import { Button, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface ReorderItem {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ReorderExercisesModalProps {
  visible: boolean;
  items: ReorderItem[];
  /** Commits the final order (removed items are excluded). */
  onDone: (orderedIds: string[]) => void;
  /** Dismisses without applying changes. */
  onClose: () => void;
}

const ROW_HEIGHT = 72;
const MINUS_SIZE = 28;
const THUMBNAIL_SIZE = 44;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Full-screen drag-and-drop reorder editor. Rows are absolutely positioned and
 * follow the finger via PanResponder + Animated (no native gesture deps); the
 * list reorders live as a row crosses its neighbours' midpoints.
 */
export const ReorderExercisesModal = React.memo(function ReorderExercisesModalBase({
  visible,
  items,
  onDone,
  onClose,
}: ReorderExercisesModalProps) {
  const [order, setOrder] = useState<ReorderItem[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderRef = useRef(order);
  orderRef.current = order;
  const valuesRef = useRef<Map<string, Animated.Value>>(new Map());

  const getValue = useCallback((id: string, initialY = 0): Animated.Value => {
    let value = valuesRef.current.get(id);
    if (!value) {
      value = new Animated.Value(initialY);
      valuesRef.current.set(id, value);
    }
    return value;
  }, []);

  // Reset order and snap each row to its slot whenever the sheet opens.
  useEffect(() => {
    if (!visible) {
      return;
    }
    setOrder(items);
    items.forEach((item, index) => {
      getValue(item.id).setValue(index * ROW_HEIGHT);
    });
  }, [visible, items, getValue]);

  // Settle non-dragged rows into their slots as the order changes.
  // useNativeDriver must stay false: the dragged row is positioned with
  // setValue() from JS, and a value can't be driven by both native and JS.
  useEffect(() => {
    order.forEach((item, index) => {
      if (item.id === draggingId) {
        return;
      }
      Animated.spring(getValue(item.id), {
        toValue: index * ROW_HEIGHT,
        useNativeDriver: false,
        bounciness: 0,
        speed: 20,
      }).start();
    });
  }, [order, draggingId, getValue]);

  const handleGrant = useCallback((id: string): number => {
    setDraggingId(id);
    return orderRef.current.findIndex(item => item.id === id);
  }, []);

  const handleMove = useCallback(
    (id: string, startIndex: number, dy: number) => {
      const absoluteY = startIndex * ROW_HEIGHT + dy;
      getValue(id).setValue(absoluteY);
      const currentIndex = orderRef.current.findIndex(item => item.id === id);
      const targetIndex = clamp(
        Math.round(absoluteY / ROW_HEIGHT),
        0,
        orderRef.current.length - 1,
      );
      if (targetIndex !== currentIndex) {
        setOrder(prev => reorder(prev, currentIndex, targetIndex));
      }
    },
    [getValue],
  );

  const handleRelease = useCallback(
    (id: string) => {
      const finalIndex = orderRef.current.findIndex(item => item.id === id);
      Animated.spring(getValue(id), {
        toValue: finalIndex * ROW_HEIGHT,
        useNativeDriver: false,
        bounciness: 0,
        speed: 20,
      }).start();
      setDraggingId(null);
    },
    [getValue],
  );

  const handleRemove = useCallback((id: string) => {
    setOrder(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleDone = () => {
    onDone(orderRef.current.map(item => item.id));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen padded={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Discards reordering"
            onPress={onClose}
            hitSlop={spacing.sm}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <ChevronLeftIcon color={colors.textPrimary} size={24} />
          </Pressable>
          <Text variant="title" accessibilityRole="header" style={styles.headerTitle}>
            Reorder
          </Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.listArea}>
          <View style={[styles.list, { height: order.length * ROW_HEIGHT }]}>
            {order.map((item, index) => (
              <ReorderRow
                key={item.id}
                item={item}
                translateY={getValue(item.id, index * ROW_HEIGHT)}
                dragging={item.id === draggingId}
                onGrant={handleGrant}
                onMove={handleMove}
                onRelease={handleRelease}
                onRemove={handleRemove}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Done"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleDone}
            accessibilityLabel="Done"
            accessibilityHint="Applies the new order"
          />
        </View>
      </Screen>
    </Modal>
  );
});

interface ReorderRowProps {
  item: ReorderItem;
  translateY: Animated.Value;
  dragging: boolean;
  onGrant: (id: string) => number;
  onMove: (id: string, startIndex: number, dy: number) => void;
  onRelease: (id: string) => void;
  onRemove: (id: string) => void;
}

const ReorderRow = React.memo(function ReorderRowBase({
  item,
  translateY,
  dragging,
  onGrant,
  onMove,
  onRelease,
  onRemove,
}: ReorderRowProps) {
  const startIndexRef = useRef(0);

  // Created once; captures stable callbacks and this row's fixed id. The drag
  // starts on any small movement from the handle (claimed in the capture phase
  // so the SVG icon can't swallow it) and can't be stolen mid-drag.
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startIndexRef.current = onGrant(item.id);
      },
      onPanResponderMove: (_event, gesture) => {
        onMove(item.id, startIndexRef.current, gesture.dy);
      },
      onPanResponderRelease: () => onRelease(item.id),
      onPanResponderTerminate: () => onRelease(item.id),
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.row, dragging && styles.rowDragging, { transform: [{ translateY }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        onPress={() => onRemove(item.id)}
        hitSlop={spacing.sm}
        style={styles.minusButton}
      >
        <MinusIcon color={colors.textOnPrimary} size={20} />
      </Pressable>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
        accessible={false}
      />
      <Text variant="subtitle" numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      {/* Drag lives only on the handle; the row body and minus button don't move it.
          box-only routes touches to this View, never the SVG icon inside it. */}
      <View
        style={styles.handle}
        pointerEvents="box-only"
        accessibilityLabel={`Drag to reorder ${item.name}`}
        {...responder.panHandlers}
      >
        <DragHandleIcon color={colors.textSecondary} size={24} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  listArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  list: {
    position: 'relative',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.xs,
    zIndex: 1,
  },
  rowDragging: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    zIndex: 2,
  },
  minusButton: {
    width: MINUS_SIZE,
    height: MINUS_SIZE,
    borderRadius: MINUS_SIZE / 2,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    backgroundColor: colors.surfaceElevated,
  },
  name: {
    flex: 1,
    textTransform: 'capitalize',
  },
  handle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
});
